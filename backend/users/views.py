from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import (
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from rest_framework import status
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.generics import CreateAPIView, ListAPIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from cineprime_api.throttling import LoginRateThrottle
from reservations.models import Ticket
from users.models import AdminPermissionLog, User
from users.serializers import (
    AdminPermissionLogSerializer,
    UserLoginSerializer,
    UserListSerializer,
    UserRegistrationSerializer,
    UserTicketSerializer,
)


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


@extend_schema_view(
    get=extend_schema(
        tags=["Users"],
        summary="Get current user",
        description="Return profile information for the authenticated user.",
        responses={200: CurrentUserResponseSerializer},
    )
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
            },
            status=status.HTTP_200_OK,
        )


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


@extend_schema(
    tags=["Admin"],
    responses={
        200: AdminGrantResponseSerializer,
        400: OpenApiResponse(description="Cannot demote the last active administrator."),
        403: OpenApiResponse(description="Admin access required."),
        404: OpenApiResponse(description="User not found."),
    },
)
class AdminGrantView(APIView):
    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Grant admin permission",
        description="Promote a user to administrator. Only admins can call this endpoint.",
        request=None,
    )
    def post(self, request, user_id, *args, **kwargs):
        target = self._get_target(user_id)

        if not target.is_staff:
            target.is_staff = True
            target.is_superuser = True
            target.save(update_fields=["is_staff", "is_superuser", "updated_at"])
            AdminPermissionLog.objects.create(
                actor=request.user,
                target=target,
                action=AdminPermissionLog.Action.GRANTED,
            )

        return Response(self._serialize(target), status=status.HTTP_200_OK)

    @extend_schema(
        summary="Revoke admin permission",
        description=(
            "Demote a user from administrator. "
            "Blocked if the target is the last active administrator."
        ),
        request=None,
    )
    def delete(self, request, user_id, *args, **kwargs):
        target = self._get_target(user_id)

        if target.is_staff:
            active_admins = User.objects.filter(is_staff=True, is_active=True).count()
            if active_admins <= 1:
                raise ValidationError(
                    "Cannot revoke the last active administrator."
                )

            target.is_staff = False
            target.is_superuser = False
            target.save(update_fields=["is_staff", "is_superuser", "updated_at"])
            AdminPermissionLog.objects.create(
                actor=request.user,
                target=target,
                action=AdminPermissionLog.Action.REVOKED,
            )

        return Response(self._serialize(target), status=status.HTTP_200_OK)

    def _get_target(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError):
            raise NotFound("User not found.")

    def _serialize(self, user):
        return {
            "id": str(user.id),
            "email": user.email,
            "username": user.username,
            "is_staff": user.is_staff,
        }


@extend_schema_view(
    get=extend_schema(
        tags=["Admin"],
        summary="List users",
        description="Return a paginated list of all users. Supports search by email or username.",
        parameters=[
            OpenApiParameter(
                name="search",
                required=False,
                location=OpenApiParameter.QUERY,
                description="Filter by email or username (case-insensitive partial match).",
            )
        ],
    )
)
class UserListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = UserListSerializer

    def get_queryset(self):
        qs = User.objects.order_by("created_at")
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(email__icontains=search) | Q(username__icontains=search)
            )
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
    permission_classes = [IsAdminUser]

    def get(self, request, user_id, *args, **kwargs):
        try:
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError):
            raise NotFound("User not found.")

        logs = AdminPermissionLog.objects.filter(target=user).select_related("actor")
        serializer = AdminPermissionLogSerializer(logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
