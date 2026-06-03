from decimal import Decimal, ROUND_HALF_UP

from django.db import migrations, models
import django.core.validators

SEED_PRICES = {
    "standard": Decimal("25.00"),
    "vip": Decimal("40.00"),
    "premium": Decimal("45.00"),
    "imax": Decimal("60.00"),
}

WEEKEND_WEEKDAYS = {4, 5, 6}


def _compute_session_price(room_base_price, start_time):
    price = Decimal(str(room_base_price))
    if start_time.weekday() in WEEKEND_WEEKDAYS:
        price = price * Decimal("1.24")
    return price.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def seed_room_type_pricing(apps, schema_editor):
    RoomTypePricing = apps.get_model("catalog", "RoomTypePricing")
    for experience_type, base_price in SEED_PRICES.items():
        RoomTypePricing.objects.get_or_create(
            experience_type=experience_type,
            defaults={"base_price": base_price},
        )


def sync_rooms_from_type_pricing(apps, schema_editor):
    Room = apps.get_model("catalog", "Room")
    RoomTypePricing = apps.get_model("catalog", "RoomTypePricing")

    pricing_map = {p.experience_type: p.base_price for p in RoomTypePricing.objects.all()}

    for room in Room.objects.all():
        if room.experience_type and room.experience_type in pricing_map:
            room.base_price = pricing_map[room.experience_type]
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
        ("catalog", "0009_room_base_price"),
    ]

    operations = [
        migrations.CreateModel(
            name="RoomTypePricing",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                (
                    "experience_type",
                    models.CharField(
                        choices=[
                            ("standard", "Traditional"),
                            ("vip", "VIP"),
                            ("premium", "Premium"),
                            ("imax", "IMAX"),
                        ],
                        max_length=30,
                        unique=True,
                    ),
                ),
                (
                    "base_price",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=8,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.01"))
                        ],
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "room_type_pricing",
                "ordering": ["experience_type"],
            },
        ),
        migrations.RunPython(
            code=seed_room_type_pricing,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.RunPython(
            code=sync_rooms_from_type_pricing,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.RunPython(
            code=recalculate_session_prices,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
