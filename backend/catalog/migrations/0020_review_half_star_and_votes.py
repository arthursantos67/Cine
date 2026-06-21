import django.db.models.deletion
import uuid
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0019_add_movie_review"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Use SeparateDatabaseAndState so Django updates its own state model
        # while the SQL handles the actual DB changes safely (with IF EXISTS / IF NOT EXISTS).
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    # Drop old constraint if it exists (table may have been created without it)
                    sql="ALTER TABLE movie_reviews DROP CONSTRAINT IF EXISTS movie_review_rating_1_to_5",
                    reverse_sql=migrations.RunSQL.noop,
                ),
                migrations.RunSQL(
                    # Change rating column to decimal, casting existing integer values
                    sql="ALTER TABLE movie_reviews ALTER COLUMN rating TYPE NUMERIC(3,1) USING rating::NUMERIC(3,1)",
                    reverse_sql="ALTER TABLE movie_reviews ALTER COLUMN rating TYPE smallint USING rating::smallint",
                ),
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE movie_reviews "
                        "ADD CONSTRAINT movie_review_rating_half_to_5 "
                        "CHECK (rating >= 0.5 AND rating <= 5.0)"
                    ),
                    reverse_sql="ALTER TABLE movie_reviews DROP CONSTRAINT IF EXISTS movie_review_rating_half_to_5",
                ),
            ],
            state_operations=[
                migrations.RemoveConstraint(
                    model_name="moviereview",
                    name="movie_review_rating_1_to_5",
                ),
                migrations.AlterField(
                    model_name="moviereview",
                    name="rating",
                    field=models.DecimalField(max_digits=3, decimal_places=1),
                ),
                migrations.AddConstraint(
                    model_name="moviereview",
                    constraint=models.CheckConstraint(
                        condition=models.Q(rating__gte=Decimal("0.5")) & models.Q(rating__lte=Decimal("5.0")),
                        name="movie_review_rating_half_to_5",
                    ),
                ),
                migrations.AlterModelOptions(
                    name="moviereview",
                    options={"db_table": "movie_reviews"},
                ),
            ],
        ),
        # Create the vote model
        migrations.CreateModel(
            name="MovieReviewVote",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("vote", models.CharField(max_length=7, choices=[("like", "Like"), ("dislike", "Dislike")])),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "review",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="votes",
                        to="catalog.moviereview",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="review_votes",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "movie_review_votes",
                "constraints": [
                    models.UniqueConstraint(
                        fields=("review", "user"),
                        name="unique_review_vote_per_user",
                    ),
                ],
            },
        ),
    ]
