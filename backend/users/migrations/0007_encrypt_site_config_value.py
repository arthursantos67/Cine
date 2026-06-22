from django.db import migrations


def encrypt_existing_site_config_values(apps, schema_editor):
    from django.conf import settings

    encryption_key = getattr(settings, "SITE_CONFIG_ENCRYPTION_KEY", None)

    SiteConfig = apps.get_model("users", "SiteConfig")
    rows = SiteConfig.objects.exclude(value="")
    if not rows.exists():
        return

    if not encryption_key:
        # No key available: clear plaintext values so they are not left exposed.
        # The admin must re-configure them after setting SITE_CONFIG_ENCRYPTION_KEY.
        count = rows.update(value="")
        print(
            f"\n  WARNING: SITE_CONFIG_ENCRYPTION_KEY is not set. "
            f"Cleared {count} plaintext site_config value(s). "
            f"Re-configure them via the admin UI after setting the key."
        )
        return

    from cryptography.fernet import Fernet

    cipher = Fernet(encryption_key)
    for config in rows:
        config.value = cipher.encrypt(config.value.encode()).decode()
        config.save(update_fields=["value"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0006_add_site_config"),
    ]

    operations = [
        migrations.RunPython(
            encrypt_existing_site_config_values,
            reverse_code=noop,
        ),
    ]
