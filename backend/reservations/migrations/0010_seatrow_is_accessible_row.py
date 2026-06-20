from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("reservations", "0009_seed_companion_seat_pairs"),
    ]

    operations = [
        migrations.AddField(
            model_name="seatrow",
            name="is_accessible_row",
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name="seatrow",
            constraint=models.UniqueConstraint(
                condition=models.Q(is_accessible_row=True),
                fields=["room"],
                name="unique_accessible_row_per_room",
            ),
        ),
    ]
