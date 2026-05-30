from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0006_room_and_session_experience_metadata"),
    ]

    operations = [
        migrations.AddField(
            model_name="movie",
            name="age_rating",
            field=models.CharField(
                blank=True,
                choices=[
                    ("L", "Livre"),
                    ("10", "10 anos"),
                    ("12", "12 anos"),
                    ("14", "14 anos"),
                    ("16", "16 anos"),
                    ("18", "18 anos"),
                ],
                default="",
                max_length=2,
                verbose_name="Faixa etária",
            ),
        ),
    ]
