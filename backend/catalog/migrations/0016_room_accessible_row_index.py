from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0015_add_max_center_seats_per_row_to_room'),
    ]

    operations = [
        migrations.AddField(
            model_name='room',
            name='accessible_row_index',
            field=models.PositiveIntegerField(default=0),
        ),
    ]
