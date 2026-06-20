"""
Data migration: configure companion seat pairs for existing accessible seats.

- Sala 1 row A: mark seats 1 & 3 as accessible, pair with companions 2 & 4
- Sala 2 row I: accessible seats 1 & 18, companions 2 & 17
- Sala 3 row I: accessible seats 1 & 18, companions 2 & 17
- Sala 4 row A: accessible seats 1,3,5,7,9, companions 2,4,6,8,10
"""

from django.db import migrations


def _pair(accessible_seat, companion_seat):
    accessible_seat.companion_seat = companion_seat
    accessible_seat.save(update_fields=["companion_seat"])


def seed_companion_pairs(apps, schema_editor):
    Room = apps.get_model("catalog", "Room")
    SeatRow = apps.get_model("reservations", "SeatRow")
    Seat = apps.get_model("reservations", "Seat")

    # ── Sala 1: row A — mark seats 1 & 3 accessible, pair with 2 & 4 ──────────
    try:
        sala1 = Room.objects.get(name="Sala 1")
        row_a = SeatRow.objects.get(room=sala1, name="A")
        seats = {s.number: s for s in Seat.objects.filter(row=row_a)}

        for num in (1, 3):
            if num in seats and not seats[num].is_accessible:
                seats[num].is_accessible = True
                seats[num].save(update_fields=["is_accessible"])

        pairs = [(1, 2), (3, 4)]
        for acc_num, comp_num in pairs:
            if acc_num in seats and comp_num in seats:
                _pair(seats[acc_num], seats[comp_num])
    except (Room.DoesNotExist, SeatRow.DoesNotExist):
        pass

    # ── Sala 2 & 3: row I — accessible 1 & 18, companions 2 & 17 ─────────────
    for room_name in ("Sala 2", "Sala 3"):
        try:
            room = Room.objects.get(name=room_name)
            row_i = SeatRow.objects.get(room=room, name="I")
            seats = {s.number: s for s in Seat.objects.filter(row=row_i)}
            pairs = [(1, 2), (18, 17)]
            for acc_num, comp_num in pairs:
                if acc_num in seats and comp_num in seats:
                    _pair(seats[acc_num], seats[comp_num])
        except (Room.DoesNotExist, SeatRow.DoesNotExist):
            pass

    # ── Sala 4: row A — accessible 1,3,5,7,9, companions 2,4,6,8,10 ──────────
    try:
        sala4 = Room.objects.get(name="Sala 4")
        row_a = SeatRow.objects.get(room=sala4, name="A")
        seats = {s.number: s for s in Seat.objects.filter(row=row_a)}
        pairs = [(1, 2), (3, 4), (5, 6), (7, 8), (9, 10)]
        for acc_num, comp_num in pairs:
            if acc_num in seats and comp_num in seats:
                _pair(seats[acc_num], seats[comp_num])
    except (Room.DoesNotExist, SeatRow.DoesNotExist):
        pass


def undo_companion_pairs(apps, schema_editor):
    Seat = apps.get_model("reservations", "Seat")
    Seat.objects.filter(companion_seat__isnull=False).update(companion_seat=None)


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0008_add_companion_seat_to_seat"),
    ]

    operations = [
        migrations.RunPython(seed_companion_pairs, undo_companion_pairs),
    ]
