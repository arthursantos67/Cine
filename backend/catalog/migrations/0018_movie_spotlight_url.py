from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0017_merge_20260618_0019"),
    ]

    operations = [
        migrations.AddField(
            model_name="movie",
            name="spotlight_url",
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
