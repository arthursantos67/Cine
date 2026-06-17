import uuid

from django.db import migrations


def create_missing_session_seats(apps, schema_editor):
    Session = apps.get_model("catalog", "Session")
    Seat = apps.get_model("reservations", "Seat")
    SessionSeat = apps.get_model("reservations", "SessionSeat")

    sessions_without_seats = Session.objects.filter(session_seats__isnull=True).distinct()

    for session in sessions_without_seats.iterator():
        seats = list(Seat.objects.filter(row__room=session.room))
        if not seats:
            continue
        SessionSeat.objects.bulk_create(
            [SessionSeat(id=uuid.uuid4(), session=session, seat=seat) for seat in seats]
        )


def remove_created_session_seats(apps, schema_editor):
    Session = apps.get_model("catalog", "Session")
    SessionSeat = apps.get_model("reservations", "SessionSeat")

    import datetime
    seeded_sessions = Session.objects.filter(
        start_time__date__gte=datetime.date(2026, 6, 16),
        start_time__date__lte=datetime.date(2026, 6, 29),
    )
    SessionSeat.objects.filter(
        session__in=seeded_sessions,
        status="AVAILABLE",
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0015_seed_sessions_june_2026"),
        ("reservations", "0008_seed_sala4_seats"),
    ]

    operations = [
        migrations.RunPython(
            create_missing_session_seats,
            reverse_code=remove_created_session_seats,
        ),
    ]
