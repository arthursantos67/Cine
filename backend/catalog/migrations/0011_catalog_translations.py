from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0010_room_type_pricing"),
    ]

    operations = [
        migrations.AddField(
            model_name="genre",
            name="translations",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="movie",
            name="translations",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="room",
            name="translations",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
