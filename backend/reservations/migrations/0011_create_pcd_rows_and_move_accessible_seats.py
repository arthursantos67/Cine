"""
Data migration: introduce a dedicated "PCD" (Pessoa com Deficiência) row per room.

Accessible and companion seats previously lived inside regular rows (A, I, …), so
ticket identifiers were ambiguous (e.g. "A1" for a wheelchair seat while "A" also
had normal seats).  This migration:

  1. Creates a SeatRow named "PCD" (is_accessible_row=True) for every room that has
     at least one accessible seat.
  2. Moves those accessible seats and their paired companion seats into the PCD row.
  3. Re-numbers the moved seats sequentially (1, 2, 3, …) so identifiers are clean.

Seat UUIDs are unchanged, so all existing SessionSeat / Ticket references remain
valid.
"""

from django.db import migrations


def create_pcd_rows(apps, schema_editor):
    Room = apps.get_model("catalog", "Room")
    SeatRow = apps.get_model("reservations", "SeatRow")
    Seat = apps.get_model("reservations", "Seat")

    for room in Room.objects.all():
        accessible_seats = list(
            Seat.objects.filter(row__room=room, is_accessible=True).order_by(
                "row__name", "number"
            )
        )
        if not accessible_seats:
            continue

        pcd_row = SeatRow.objects.create(
            room=room,
            name="PCD",
            is_accessible_row=True,
        )

        # Build ordered list: [accessible, companion, accessible, companion, …]
        ordered = []
        used_ids = set()
        for acc in accessible_seats:
            if acc.pk in used_ids:
                continue
            ordered.append(acc)
            used_ids.add(acc.pk)
            if acc.companion_seat_id:
                comp = Seat.objects.filter(pk=acc.companion_seat_id).first()
                if comp and comp.pk not in used_ids:
                    ordered.append(comp)
                    used_ids.add(comp.pk)

        # Re-number and move to PCD row
        for new_number, seat in enumerate(ordered, start=1):
            seat.row = pcd_row
            seat.number = new_number
            seat.save(update_fields=["row", "number"])


def remove_pcd_rows(apps, schema_editor):
    SeatRow = apps.get_model("reservations", "SeatRow")
    SeatRow.objects.filter(is_accessible_row=True).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0010_seatrow_is_accessible_row"),
    ]

    operations = [
        migrations.RunPython(create_pcd_rows, remove_pcd_rows),
    ]
