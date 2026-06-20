from django.db.models import Case, IntegerField, Q, Value, When
from django.utils import timezone
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from rest_framework import status
from rest_framework import serializers
from rest_framework.exceptions import APIException, NotFound, PermissionDenied, ValidationError
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from cineprime_api.permissions import IsMasterUser
from cineprime_api.throttling import LoginRateThrottle
from reservations.models import SessionSeat, SessionSeatStatus, Ticket
from users.models import AdminPermissionLog, User
from users.serializers import (
    AdminPermissionLogSerializer,
    UserLoginSerializer,
    UserListSerializer,
    UserRegistrationSerializer,
    UserTicketSerializer,
)


class HasActiveTickets(APIException):
    status_code = 409
    default_code = "HAS_ACTIVE_TICKETS"
    default_detail = "User has active tickets."

    def __init__(self, ticket_count=0):
        super().__init__()
        self.ticket_count = ticket_count


class OnlyMasterAdmin(APIException):
    status_code = 400
    default_code = "ONLY_MASTER_ADMIN"
    default_detail = "You are the only master admin. Promote another user to master before deleting your account."


class ProtectedTransferRequired(APIException):
    status_code = 400
    default_code = "PROTECTED_TRANSFER_REQUIRED"
    default_detail = "You are the protected master. Designate a successor master before deleting your account."


def _delete_user_cascade(user):
    SessionSeat.objects.filter(ticket__user=user).update(
        status=SessionSeatStatus.AVAILABLE,
        locked_by_user=None,
        lock_expires_at=None,
    )
    Ticket.objects.filter(user=user).delete()
    AdminPermissionLog.objects.filter(target=user).delete()
    user.delete()


class UserLoginResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class TokenRefreshResponseSerializer(serializers.Serializer):
    access = serializers.CharField()


class CurrentUserResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    email = serializers.EmailField()
    username = serializers.CharField()
    created_at = serializers.DateTimeField()
    is_staff = serializers.BooleanField()
    role = serializers.CharField()


@extend_schema_view(
    post=extend_schema(
        tags=["Auth"],
        summary="Register user",
        description="Create a new user account.",
        request=UserRegistrationSerializer,
        responses={
            201: UserRegistrationSerializer,
            400: OpenApiResponse(description="Validation error."),
        },
    )
)
class UserRegistrationView(CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]


@extend_schema_view(
    post=extend_schema(
        tags=["Auth"],
        summary="Login user",
        description="Authenticate with email and password and return JWT tokens.",
        request=UserLoginSerializer,
        responses={
            200: UserLoginResponseSerializer,
            401: OpenApiResponse(description="Invalid credentials."),
            429: OpenApiResponse(description="Too many login attempts."),
        },
    )
)
class UserLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


@extend_schema_view(
    post=extend_schema(
        tags=["Auth"],
        summary="Refresh access token",
        description="Issue a new JWT access token from a valid refresh token.",
        request=TokenRefreshSerializer,
        responses={
            200: TokenRefreshResponseSerializer,
            401: OpenApiResponse(description="Invalid or expired refresh token."),
        },
    )
)
class UserTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]


class SelfDeleteConflictResponseSerializer(serializers.Serializer):
    ticket_count = serializers.IntegerField()


@extend_schema_view(
    get=extend_schema(
        tags=["Users"],
        summary="Get current user",
        description="Return profile information for the authenticated user.",
        responses={200: CurrentUserResponseSerializer},
    ),
    delete=extend_schema(
        tags=["Users"],
        summary="Delete own account",
        description=(
            "Permanently delete the authenticated user's account. "
            "Master admins can only delete their own account if another master exists. "
            "If the account has active tickets, resend with ?confirm=true to proceed."
        ),
        parameters=[
            OpenApiParameter(
                name="confirm",
                location=OpenApiParameter.QUERY,
                description="Set to 'true' to confirm deletion when the account has tickets.",
                required=False,
            )
        ],
        responses={
            204: None,
            400: OpenApiResponse(description="Account cannot be deleted (last master or protected)."),
            409: OpenApiResponse(response=SelfDeleteConflictResponseSerializer, description="Account has active tickets. Resend with ?confirm=true."),
        },
    ),
)
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(
            {
                "id": str(request.user.id),
                "email": request.user.email,
                "username": request.user.username,
                "created_at": request.user.created_at,
                "is_staff": request.user.is_staff,
                "role": request.user.role,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, *args, **kwargs):
        user = request.user

        password = request.data.get("password", "")
        if not password or not user.check_password(password):
            raise ValidationError("Incorrect password.")

        if user.is_superuser:
            other_master_exists = User.objects.filter(is_superuser=True).exclude(pk=user.pk).exists()
            if not other_master_exists:
                raise OnlyMasterAdmin()

        successor = None
        if user.is_protected:
            transfer_to_id = request.data.get("transfer_to")
            if not transfer_to_id:
                raise ProtectedTransferRequired()
            try:
                successor = User.objects.get(pk=transfer_to_id, is_superuser=True)
                if successor.pk == user.pk:
                    raise ValidationError("Cannot transfer protected status to yourself.")
            except (User.DoesNotExist, ValueError):
                raise ValidationError("Designated successor must be an existing master.")

        confirm = request.query_params.get("confirm") == "true"
        ticket_count = Ticket.objects.filter(user=user).count()

        if ticket_count > 0 and not confirm:
            raise HasActiveTickets(ticket_count=ticket_count)

        if successor is not None:
            successor.is_protected_master = True
            successor.save(update_fields=["is_protected_master", "updated_at"])

        _delete_user_cascade(user)
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    get=extend_schema(
        tags=["Users"],
        summary="List my tickets",
        description="Return tickets of the authenticated user, optionally filtered by time type.",
        parameters=[
            OpenApiParameter(
                name="type",
                required=False,
                location=OpenApiParameter.QUERY,
                description="Filter by ticket type.",
                enum=["upcoming", "past"],
            )
        ],
    )
)
class MyTicketsView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserTicketSerializer
    ALLOWED_TYPE_FILTERS = {"upcoming", "past"}

    def _get_validated_type_filter(self):
        ticket_type = self.request.query_params.get("type")

        if ticket_type is None or ticket_type in self.ALLOWED_TYPE_FILTERS:
            return ticket_type

        raise ValidationError(
            {
                "type": [
                    "Invalid type filter. Expected one of: upcoming, past.",
                ]
            }
        )

    def get_queryset(self):
        queryset = (
            Ticket.objects.filter(user=self.request.user)
            .select_related(
                "session_seat__session__movie",
                "session_seat__session__room",
                "session_seat__seat__row",
            )
            .order_by("-created_at")
        )

        ticket_type = self._get_validated_type_filter()
        now = timezone.now()

        if ticket_type == "upcoming":
            queryset = queryset.filter(session_seat__session__start_time__gt=now)
        elif ticket_type == "past":
            queryset = queryset.filter(session_seat__session__start_time__lte=now)

        return queryset


class AdminGrantResponseSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    email = serializers.EmailField()
    username = serializers.CharField()
    is_staff = serializers.BooleanField()
    is_protected = serializers.BooleanField()
    role = serializers.CharField()
    created_at = serializers.DateTimeField()


class RoleGrantBodySerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=["staff", "master"], default="staff", required=False)


@extend_schema(
    tags=["Admin"],
    responses={
        200: AdminGrantResponseSerializer,
        400: OpenApiResponse(description="Cannot modify your own permissions or the protected admin account."),
        403: OpenApiResponse(description="Master access required."),
        404: OpenApiResponse(description="User not found."),
    },
)
class AdminGrantView(APIView):
    permission_classes = [IsMasterUser]

    @extend_schema(
        summary="Grant staff or master permission",
        description=(
            "Promote a user to staff or master. "
            "Only masters can call this endpoint. "
            "Pass {\"role\": \"master\"} to promote to master; defaults to staff."
        ),
        request=RoleGrantBodySerializer,
    )
    def post(self, request, user_id, *args, **kwargs):
        target = self._get_target(user_id)

        self._check_not_protected(target)

        body = RoleGrantBodySerializer(data=request.data)
        body.is_valid(raise_exception=True)
        requested_role = body.validated_data["role"]

        grant_master = requested_role == "master"

        already_master = target.is_superuser
        already_staff = target.is_staff and not target.is_superuser

        # No-op if target already has the exact requested role
        if grant_master and already_master:
            return Response(self._serialize(target), status=status.HTTP_200_OK)

        if not grant_master and already_staff:
            return Response(self._serialize(target), status=status.HTTP_200_OK)

        if not grant_master and already_master:
            # Downgrade master → staff: revoke superuser, keep is_staff
            target.is_superuser = False
            target.save(update_fields=["is_superuser", "updated_at"])
            AdminPermissionLog.objects.create(
                actor=request.user,
                target=target,
                action=AdminPermissionLog.Action.REVOKED,
                role=AdminPermissionLog.Role.MASTER,
            )
            return Response(self._serialize(target), status=status.HTTP_200_OK)

        target.is_staff = True
        target.is_superuser = grant_master
        target.save(update_fields=["is_staff", "is_superuser", "updated_at"])
        AdminPermissionLog.objects.create(
            actor=request.user,
            target=target,
            action=AdminPermissionLog.Action.GRANTED,
            role=AdminPermissionLog.Role.MASTER if grant_master else AdminPermissionLog.Role.STAFF,
        )

        return Response(self._serialize(target), status=status.HTTP_200_OK)

    @extend_schema(
        summary="Revoke admin permission",
        description=(
            "Fully demote a user (staff or master) back to regular user. "
            "Blocked only for the protected primary admin account."
        ),
        request=None,
    )
    def delete(self, request, user_id, *args, **kwargs):
        target = self._get_target(user_id)
        self._check_not_protected(target)

        if target.is_staff or target.is_superuser:
            revoked_role = (
                AdminPermissionLog.Role.MASTER
                if target.is_superuser
                else AdminPermissionLog.Role.STAFF
            )
            target.is_staff = False
            target.is_superuser = False
            target.save(update_fields=["is_staff", "is_superuser", "updated_at"])
            AdminPermissionLog.objects.create(
                actor=request.user,
                target=target,
                action=AdminPermissionLog.Action.REVOKED,
                role=revoked_role,
            )

        return Response(self._serialize(target), status=status.HTTP_200_OK)

    def _get_target(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError):
            raise NotFound("User not found.")

    def _check_not_protected(self, target):
        if target == self.request.user:
            raise ValidationError("You cannot modify your own admin permissions.")
        if target.is_protected:
            raise ValidationError("Cannot modify the primary admin account.")

    def _serialize(self, user):
        return {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "is_staff": user.is_staff,
            "is_protected": user.is_protected,
            "role": user.role,
            "created_at": user.created_at,
        }


@extend_schema_view(
    get=extend_schema(
        tags=["Admin"],
        summary="List users",
        description="Return a paginated list of all users. Supports search by email or username and filtering by role.",
        parameters=[
            OpenApiParameter(
                name="search",
                required=False,
                location=OpenApiParameter.QUERY,
                description="Filter by email or username (case-insensitive partial match).",
            ),
            OpenApiParameter(
                name="role",
                required=False,
                location=OpenApiParameter.QUERY,
                description="Filter by role: 'master', 'staff', or 'user'.",
                enum=["master", "staff", "user"],
            ),
        ],
    )
)
class UserListView(ListAPIView):
    permission_classes = [IsMasterUser]
    serializer_class = UserListSerializer

    def get_queryset(self):
        qs = User.objects.annotate(
            is_me=Case(
                When(pk=self.request.user.pk, then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
        ).order_by("is_me", "created_at")

        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(email__icontains=search) | Q(username__icontains=search)
            )

        role = self.request.query_params.get("role", "").strip()
        if role == "master":
            qs = qs.filter(is_superuser=True)
        elif role == "staff":
            qs = qs.filter(is_staff=True, is_superuser=False)
        elif role == "user":
            qs = qs.filter(is_staff=False)

        return qs


@extend_schema_view(
    get=extend_schema(
        tags=["Admin"],
        summary="List permission audit log for a user",
        description="Return the admin permission change history for a specific user.",
        responses={
            200: AdminPermissionLogSerializer(many=True),
            403: OpenApiResponse(description="Admin access required."),
            404: OpenApiResponse(description="User not found."),
        },
    )
)
class UserPermissionLogsView(APIView):
    permission_classes = [IsMasterUser]

    def get(self, request, user_id, *args, **kwargs):
        try:
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError):
            raise NotFound("User not found.")

        logs = (
            AdminPermissionLog.objects
            .filter(target=user)
            .select_related("actor")
            .order_by("-created_at")[:50]
        )
        serializer = AdminPermissionLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UserDeleteConflictResponseSerializer(serializers.Serializer):
    ticket_count = serializers.IntegerField()


@extend_schema(
    tags=["Admin"],
    summary="Delete user account",
    description=(
        "Permanently delete a user account. "
        "Cannot delete the primary admin account or your own account via this endpoint. "
        "If the user has active tickets, resend with ?confirm=true to proceed."
    ),
    parameters=[
        OpenApiParameter(
            name="confirm",
            location=OpenApiParameter.QUERY,
            description="Set to 'true' to confirm deletion even if the user has tickets.",
            required=False,
        )
    ],
    responses={
        204: None,
        400: OpenApiResponse(description="Cannot delete protected or own account."),
        403: OpenApiResponse(description="Master access required."),
        404: OpenApiResponse(description="User not found."),
        409: OpenApiResponse(response=UserDeleteConflictResponseSerializer, description="User has active tickets. Resend with ?confirm=true."),
    },
)
class UserDeleteView(APIView):
    permission_classes = [IsMasterUser]

    def delete(self, request, user_id, *args, **kwargs):
        try:
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError):
            raise NotFound("User not found.")

        if user == request.user:
            raise ValidationError("To delete your own account, use your profile settings.")

        if user.is_protected:
            raise ValidationError("Cannot delete the primary admin account.")

        password = request.data.get("password", "")
        if not password or not request.user.check_password(password):
            raise ValidationError("Incorrect password.")

        confirm = request.query_params.get("confirm") == "true"
        ticket_count = Ticket.objects.filter(user=user).count()

        if ticket_count > 0 and not confirm:
            raise HasActiveTickets(ticket_count=ticket_count)

        _delete_user_cascade(user)
        return Response(status=status.HTTP_204_NO_CONTENT)
