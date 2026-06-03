from decimal import Decimal, ROUND_HALF_UP

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from catalog.models import CastMember, Genre, Movie, Room, Session
from reservations.models import SessionSeat, SessionSeatStatus, Seat

_WEEKEND_WEEKDAYS = {4, 5, 6}  # Friday, Saturday, Sunday


def compute_session_price(room_base_price, start_time):
    """Return session ticket price: room base_price with 24% surcharge on Fri/Sat/Sun."""
    price = Decimal(str(room_base_price))
    if start_time.weekday() in _WEEKEND_WEEKDAYS:
        price = price * Decimal("1.24")
    return price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def raise_serializer_validation_error(exc):
    details = getattr(exc, "message_dict", None) or getattr(exc, "messages", None)
    raise serializers.ValidationError(details or str(exc)) from exc


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class GenreSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name"]


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "capacity",
            "experience_type",
            "display_name",
            "description",
            "base_price",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_capacity(self, value):
        if self.instance is None:
            return value

        actual_seat_count = Seat.objects.filter(row__room=self.instance).count()
        if value < actual_seat_count:
            raise serializers.ValidationError(
                "Room capacity cannot be lower than the number of registered seats."
            )

        return value

    def create(self, validated_data):
        room = Room(**validated_data)

        try:
            room.save()
        except DjangoValidationError as exc:
            raise_serializer_validation_error(exc)

        return room

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)

        try:
            instance.save()
        except DjangoValidationError as exc:
            raise_serializer_validation_error(exc)

        return instance


class RoomSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = [
            "id",
            "name",
            "capacity",
            "experience_type",
            "display_name",
            "description",
        ]


class MovieWriteSerializer(serializers.ModelSerializer):
    genres = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Genre.objects.all(),
    )
    cast = serializers.ListField(
        child=serializers.CharField(max_length=255),
        required=False,
        default=list,
        write_only=True,
    )

    class Meta:
        model = Movie
        fields = [
            "id",
            "title",
            "genres",
            "synopsis",
            "duration_minutes",
            "release_date",
            "poster_url",
            "age_rating",
            "director",
            "cast",
            "status",
            "is_featured",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["cast"] = [m.name for m in instance.cast.all()]
        return data

    @transaction.atomic
    def create(self, validated_data):
        cast_names = validated_data.pop("cast", [])
        movie = super().create(validated_data)
        CastMember.objects.bulk_create(
            [CastMember(movie=movie, name=name, order=i) for i, name in enumerate(cast_names)]
        )
        return movie

    @transaction.atomic
    def update(self, instance, validated_data):
        cast_names = validated_data.pop("cast", None)
        movie = super().update(instance, validated_data)
        if cast_names is not None:
            instance.cast.all().delete()
            CastMember.objects.bulk_create(
                [CastMember(movie=movie, name=name, order=i) for i, name in enumerate(cast_names)]
            )
        return movie


class MovieReadSerializer(serializers.ModelSerializer):
    genres = GenreSummarySerializer(many=True, read_only=True)
    cast = serializers.SerializerMethodField()

    def get_cast(self, obj):
        return [m.name for m in obj.cast.all()]

    class Meta:
        model = Movie
        fields = [
            "id",
            "title",
            "genres",
            "synopsis",
            "duration_minutes",
            "release_date",
            "poster_url",
            "age_rating",
            "director",
            "cast",
            "status",
            "is_featured",
            "created_at",
            "updated_at",
        ]


class MovieSummarySerializer(serializers.ModelSerializer):
    genres = GenreSummarySerializer(many=True, read_only=True)
    cast = serializers.SerializerMethodField()

    def get_cast(self, obj):
        return [m.name for m in obj.cast.all()]

    class Meta:
        model = Movie
        fields = [
            "id",
            "title",
            "genres",
            "duration_minutes",
            "release_date",
            "poster_url",
            "age_rating",
            "director",
            "cast",
            "status",
            "is_featured",
        ]


class SessionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = [
            "id",
            "movie",
            "room",
            "start_time",
            "end_time",
            "base_price",
            "audio_format",
            "projection_format",
            "session_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "base_price", "created_at", "updated_at"]

    def validate(self, attrs):
        attrs = super().validate(attrs)

        if (
            self.instance is not None
            and "room" in attrs
            and attrs["room"] != self.instance.room
        ):
            raise serializers.ValidationError(
                {"room": ("Updating the room of an existing session is not supported.")}
            )

        if self.instance is not None:
            protected_session_fields = ["movie", "room", "start_time", "end_time"]
            changed_protected_fields = [
                field
                for field in protected_session_fields
                if field in attrs and attrs[field] != getattr(self.instance, field)
            ]

            if changed_protected_fields:
                has_reserved_or_purchased_seats = SessionSeat.objects.filter(
                    session=self.instance,
                    status__in=[
                        SessionSeatStatus.RESERVED,
                        SessionSeatStatus.PURCHASED,
                    ],
                ).exists()

                if has_reserved_or_purchased_seats:
                    raise serializers.ValidationError(
                        {
                            field: (
                                "Sessions with reserved or purchased seats cannot change movie, room, or time."
                            )
                            for field in changed_protected_fields
                        }
                    )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        room = validated_data["room"]
        start_time = validated_data["start_time"]
        validated_data["base_price"] = compute_session_price(
            room.base_price, start_time
        )

        session = Session(**validated_data)

        try:
            session.save()
        except DjangoValidationError as exc:
            raise_serializer_validation_error(exc)

        seats = Seat.objects.select_related("row").filter(row__room=session.room)

        session_seats = [SessionSeat(session=session, seat=seat) for seat in seats]

        SessionSeat.objects.bulk_create(session_seats)

        return session

    def update(self, instance, validated_data):
        if "start_time" in validated_data:
            validated_data["base_price"] = compute_session_price(
                instance.room.base_price, validated_data["start_time"]
            )

        for field, value in validated_data.items():
            setattr(instance, field, value)

        try:
            instance.save()
        except DjangoValidationError as exc:
            raise_serializer_validation_error(exc)

        return instance


class SessionReadSerializer(serializers.ModelSerializer):
    movie = MovieSummarySerializer(read_only=True)
    room = RoomSummarySerializer(read_only=True)

    class Meta:
        model = Session
        fields = [
            "id",
            "movie",
            "room",
            "start_time",
            "end_time",
            "base_price",
            "audio_format",
            "projection_format",
            "session_type",
            "created_at",
            "updated_at",
        ]
