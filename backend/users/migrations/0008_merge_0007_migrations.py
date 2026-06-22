from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0007_encrypt_site_config_value"),
        ("users", "0007_siteconfig_created_at"),
    ]

    operations = []
