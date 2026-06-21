from datetime import timedelta
from functools import partial

from django.db import transaction
from django.utils import timezone

from catalog.models import Session
from reservations.exceptions import (
    InvalidSeatSelectionError,
    SeatUnavailableError,
    SessionExpiredError,
    SessionNotFoundError,
)
from reservations.locks import SeatLockManager
from reservations.models import Seat, SessionSeat, SessionSeatStatus


def _schedule_expiration_tasks(session_seat_ids, expires_at):
    from reservations.tasks import release_expired_session_seat

    for session_seat_id in session_seat_ids:
        release_expired_session_seat.apply_async(
            args=[session_seat_id],
            eta=expires_at,
        )


class TemporaryReservationService:
    LOCK_DURATION_SECONDS = 600
    SESSION_SALE_CUTOFF_MINUTES = 10
    SEAT_UNAVAILABLE_MESSAGE = "One or more selected seats are not available."
    INVALID_SELECTION_MESSAGE = (
        "One or more selected seats do not belong to this session."
    )
    COMPANION_WITHOUT_ACCESSIBLE_MESSAGE = (
        "Companion seat must be reserved together with its paired accessible seat."
    )

    def __init__(self):
        self.lock_manager = SeatLockManager(timeout_seconds=self.LOCK_DURATION_SECONDS)

    def _validate_companion_seat_rules(self, seat_ids):
        seat_id_set = set(seat_ids)
        companion_seat_ids = set(
            Seat.objects.filter(companion_seat__in=seat_id_set)
            .values_list("companion_seat_id", flat=True)
        )
        if not companion_seat_ids:
            return

        accessible_by_companion = {
            seat.companion_seat_id: seat.id
            for seat in Seat.objects.filter(companion_seat_id__in=companion_seat_ids)
        }
        for seat_id in seat_id_set:
            if seat_id in companion_seat_ids:
                accessible_id = accessible_by_companion.get(seat_id)
                if accessible_id is not None and accessible_id not in seat_id_set:
                    raise InvalidSeatSelectionError(self.COMPANION_WITHOUT_ACCESSIBLE_MESSAGE)

    def execute(self, *, session_id, seat_ids, user):
        try:
            session = Session.objects.get(id=session_id)
        except Session.DoesNotExist:
            raise SessionNotFoundError("Session not found.")

        cutoff = session.start_time + timedelta(minutes=self.SESSION_SALE_CUTOFF_MINUTES)
        if timezone.now() >= cutoff:
            raise SessionExpiredError("Ticket sales for this session have ended.")

        ordered_seat_ids = sorted(seat_ids)

        session_seats = list(
            SessionSeat.objects.select_related("seat", "seat__row")
            .filter(session_id=session_id, seat_id__in=ordered_seat_ids)
            .order_by("seat_id")
        )

        if len(session_seats) != len(ordered_seat_ids):
            raise InvalidSeatSelectionError(self.INVALID_SELECTION_MESSAGE)

        for session_seat in session_seats:
            if session_seat.status != SessionSeatStatus.AVAILABLE:
                raise SeatUnavailableError(self.SEAT_UNAVAILABLE_MESSAGE)

        self._validate_companion_seat_rules(ordered_seat_ids)

        acquired_locks = []
        expires_at = timezone.now() + timedelta(seconds=self.LOCK_DURATION_SECONDS)

        try:
            for session_seat in session_seats:
                acquired = self.lock_manager.acquire(
                    session_id=session_id,
                    seat_id=session_seat.seat_id,
                    owner_id=user.id,
                )
                if not acquired:
                    raise SeatUnavailableError(self.SEAT_UNAVAILABLE_MESSAGE)

                acquired_locks.append(session_seat)

            with transaction.atomic():
                locked_session_seats = list(
                    SessionSeat.objects.select_for_update()
                    .select_related("seat", "seat__row")
                    .filter(
                        session_id=session_id,
                        seat_id__in=ordered_seat_ids,
                    )
                    .order_by("seat_id")
                )

                if len(locked_session_seats) != len(ordered_seat_ids):
                    raise InvalidSeatSelectionError(self.INVALID_SELECTION_MESSAGE)

                for session_seat in locked_session_seats:
                    if session_seat.status != SessionSeatStatus.AVAILABLE:
                        raise SeatUnavailableError(self.SEAT_UNAVAILABLE_MESSAGE)

                for session_seat in locked_session_seats:
                    session_seat.status = SessionSeatStatus.RESERVED
                    session_seat.locked_by_user = user
                    session_seat.lock_expires_at = expires_at

                SessionSeat.objects.bulk_update(
                    locked_session_seats,
                    ["status", "locked_by_user", "lock_expires_at"],
                )

                reserved_session_seat_ids = [
                    str(session_seat.id) for session_seat in locked_session_seats
                ]

                transaction.on_commit(
                    partial(
                        _schedule_expiration_tasks,
                        reserved_session_seat_ids,
                        expires_at,
                    )
                )

            return {
                "session_id": session_id,
                "status": "TEMPORARILY_RESERVED",
                "expires_at": expires_at,
                "seats": locked_session_seats,
            }

        except Exception:
            for session_seat in acquired_locks:
                self.lock_manager.release(
                    session_id=session_id,
                    seat_id=session_seat.seat_id,
                )
            raise
