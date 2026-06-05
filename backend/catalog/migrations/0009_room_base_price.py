from decimal import Decimal, ROUND_HALF_UP

from django.db import migrations, models
import django.core.validators


EXPERIENCE_DEFAULT_PRICES = {
    "standard": Decimal("25.00"),
    "vip": Decimal("40.00"),
    "premium": Decimal("45.00"),
    "imax": Decimal("60.00"),
}

WEEKEND_WEEKDAYS = {4, 5, 6}  # Friday, Saturday, Sunday (Python weekday())


def _compute_session_price(room_base_price, start_time):
    price = Decimal(str(room_base_price))
    if start_time.weekday() in WEEKEND_WEEKDAYS:
        price = price * Decimal("1.24")
    return price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def backfill_room_prices(apps, schema_editor):
    Room = apps.get_model("catalog", "Room")

    for room in Room.objects.all():
        experience = room.experience_type or ""
        room.base_price = EXPERIENCE_DEFAULT_PRICES.get(experience, Decimal("25.00"))
        room.save(update_fields=["base_price"])


def recalculate_session_prices(apps, schema_editor):
    Session = apps.get_model("catalog", "Session")

    for session in Session.objects.select_related("room").iterator():
        session.base_price = _compute_session_price(
            session.room.base_price, session.start_time
        )
        session.save(update_fields=["base_price"])


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0008_movie_director_cast"),
    ]

    operations = [
        migrations.AddField(
            model_name="room",
            name="base_price",
            field=models.DecimalField(
                decimal_places=2,
                default=Decimal("25.00"),
                max_digits=8,
                validators=[django.core.validators.MinValueValidator(Decimal("0.01"))],
            ),
            preserve_default=False,
        ),
        migrations.RunPython(
            code=backfill_room_prices,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.RunPython(
            code=recalculate_session_prices,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
