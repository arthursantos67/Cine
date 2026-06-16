import uuid

from django.db import migrations


def complete_sala4_seats(apps, schema_editor):
    Room = apps.get_model("catalog", "Room")
    SeatRow = apps.get_model("reservations", "SeatRow")
    Seat = apps.get_model("reservations", "Seat")

    try:
        sala4 = Room.objects.get(name="Sala 4")
    except Room.DoesNotExist:
        return

    # Layout: rows A–J, 12 seats each = 120 total.
    # Row A already exists with 9 accessible seats (1-9); complete it to 12.
    # Rows B and C already exist with 12 seats each; skip them.
    # Rows D–J are new.

    row_a, _ = SeatRow.objects.get_or_create(
        room=sala4, name="A", defaults={"id": uuid.uuid4()}
    )
    existing_numbers = set(
        Seat.objects.filter(row=row_a).values_list("number", flat=True)
    )
    for number in range(1, 13):
        if number not in existing_numbers:
            Seat.objects.create(id=uuid.uuid4(), row=row_a, number=number)

    new_rows = list("DEFGHIJ")
    for row_name in new_rows:
        row, _ = SeatRow.objects.get_or_create(
            room=sala4, name=row_name, defaults={"id": uuid.uuid4()}
        )
        existing_numbers = set(
            Seat.objects.filter(row=row).values_list("number", flat=True)
        )
        seats = [
            Seat(id=uuid.uuid4(), row=row, number=n)
            for n in range(1, 13)
            if n not in existing_numbers
        ]
        if seats:
            Seat.objects.bulk_create(seats)


def remove_sala4_seats(apps, schema_editor):
    Room = apps.get_model("catalog", "Room")
    SeatRow = apps.get_model("reservations", "SeatRow")
    Seat = apps.get_model("reservations", "Seat")

    try:
        sala4 = Room.objects.get(name="Sala 4")
    except Room.DoesNotExist:
        return

    # Remove seats added by this migration:
    # - seats 10-12 in row A
    # - all seats in rows D–J (and the rows themselves)
    row_a = SeatRow.objects.filter(room=sala4, name="A").first()
    if row_a:
        Seat.objects.filter(row=row_a, number__in=[10, 11, 12]).delete()

    SeatRow.objects.filter(room=sala4, name__in=list("DEFGHIJ")).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0009_room_base_price"),
        ("reservations", "0007_normalize_session_seat_status"),
    ]

    operations = [
        migrations.RunPython(complete_sala4_seats, reverse_code=remove_sala4_seats),
    ]
