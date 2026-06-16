from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_adminpermissionlog"),
    ]

    operations = [
        migrations.AddField(
            model_name="adminpermissionlog",
            name="role",
            field=models.CharField(
                blank=True,
                choices=[("staff", "Staff"), ("master", "Master")],
                max_length=10,
                null=True,
            ),
        ),
    ]
