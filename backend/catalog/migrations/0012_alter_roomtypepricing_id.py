from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0011_catalog_translations"),
    ]

    operations = [
        migrations.AlterField(
            model_name="roomtypepricing",
            name="id",
            field=models.BigAutoField(
                auto_created=True,
                primary_key=True,
                serialize=False,
                verbose_name="ID",
            ),
        ),
    ]
