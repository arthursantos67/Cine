from django.contrib import admin

from catalog.models import CastMember, Genre, Movie, Room, Session


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ("name", "created_at")
    search_fields = ("name",)


class CastMemberInline(admin.TabularInline):
    model = CastMember
    extra = 3
    fields = ("order", "name")
    ordering = ("order", "name")
    verbose_name = "Membro do elenco"
    verbose_name_plural = "Elenco principal"


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "age_rating",
        "director",
        "duration_minutes",
        "status",
        "release_date",
        "created_at",
    )
    list_filter = ("status", "age_rating")
    search_fields = ("title", "director")
    filter_horizontal = ("genres",)
    inlines = [CastMemberInline]
    fieldsets = (
        (None, {
            "fields": ("title", "synopsis", "poster_url", "translations"),
        }),
        ("Informações do filme", {
            "fields": ("genres", "duration_minutes", "release_date", "age_rating", "director"),
        }),
        ("Publicação", {
            "fields": ("status", "is_featured"),
        }),
    )


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("name", "display_name", "experience_type", "capacity", "created_at")
    list_filter = ("experience_type",)
    search_fields = ("name", "display_name", "description")


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = (
        "movie",
        "room",
        "start_time",
        "end_time",
        "base_price",
        "audio_format",
        "projection_format",
        "session_type",
        "created_at",
    )
    list_filter = (
        "room",
        "audio_format",
        "projection_format",
        "session_type",
        "start_time",
    )
    search_fields = ("movie__title", "room__name")
