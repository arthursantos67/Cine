import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0007_movie_age_rating"),
    ]

    operations = [
        migrations.AddField(
            model_name="movie",
            name="director",
            field=models.CharField(
                blank=True,
                default="",
                max_length=255,
                verbose_name="Direção",
            ),
        ),
        migrations.CreateModel(
            name="CastMember",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("order", models.PositiveSmallIntegerField(default=0, verbose_name="Ordem")),
                (
                    "movie",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="cast",
                        to="catalog.movie",
                    ),
                ),
            ],
            options={
                "db_table": "cast_members",
                "ordering": ["order", "name"],
            },
        ),
    ]
