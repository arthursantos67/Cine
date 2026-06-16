import datetime
import uuid

from django.db import migrations


def seed_sessions(apps, schema_editor):
    Movie = apps.get_model("catalog", "Movie")
    Room = apps.get_model("catalog", "Room")
    Session = apps.get_model("catalog", "Session")

    movie_map = {m.title: m for m in Movie.objects.all()}
    room_map = {r.name: r for r in Room.objects.all()}

    def find_movie(fragment):
        for title, movie in movie_map.items():
            if fragment.lower() in title.lower():
                return movie
        return None

    def make_dt(date, hour, minute):
        return datetime.datetime(
            date.year, date.month, date.day, hour, minute,
            tzinfo=datetime.timezone.utc,
        )

    def add(date, h, m, room_name, movie_fragment, audio="", projection="", stype="regular"):
        movie = find_movie(movie_fragment)
        room = room_map.get(room_name)
        if not movie or not room:
            return
        start = make_dt(date, h, m)
        end = start + datetime.timedelta(minutes=movie.duration_minutes + 5)
        if Session.objects.filter(room=room, start_time__lt=end, end_time__gt=start).exists():
            return
        Session.objects.create(
            id=uuid.uuid4(),
            movie=movie,
            room=room,
            start_time=start,
            end_time=end,
            base_price=room.base_price,
            audio_format=audio,
            projection_format=projection,
            session_type=stype,
        )

    # 14-day schedule: 2026-06-16 (Mon) to 2026-06-29 (Sun)
    #
    # Sala 1 (standard)  – 4 time-slots/day, rotating short-to-mid films
    # Sala 2 (premium)   – 4 time-slots/day, mid-length featured films
    # Sala 3 (IMAX)      – 3–4 time-slots/day, epic films (adjusted times for long movies)
    # Sala 4 (standard)  – 3–4 time-slots/day, shares some titles with Sala 1 (same movie / different room)
    #
    # Highlights:
    #   • Same movie in different rooms on the same day (A Origem in Sala 2 + Sala 3; A Rede Social in Sala 1 + Sala 4)
    #   • Same movie on different days (Batman runs all 14 days between Sala 2 and Sala 3)
    #   • Different movies each day across all rooms
    #   • Varied audio (legendado / dublado / original) and projection (2d / 3d / imax) formats

    start_date = datetime.date(2026, 6, 16)

    for offset in range(14):
        date = start_date + datetime.timedelta(days=offset)
        dow = date.weekday()   # 0=Mon … 6=Sun
        week = offset // 7     # 0=week-1  1=week-2

        # ── SALA 1 (standard) ─────────────────────────────────────────────────
        # end-times (slot + movie + 5 min buffer):
        #   12:00 + 125 = 14:05  |  15:05 + 132 = 17:17
        #   18:10 + 123 = 20:13  |  21:15 + 144 = 23:39
        if week == 0:
            if dow < 4:   # Mon–Thu
                add(date, 12,  0, "Sala 1", "Rede Social",  "legendado", "2d")
                add(date, 15,  5, "Sala 1", "Se7en",        "legendado", "2d")
                add(date, 18, 10, "Sala 1", "Inocentes",    "dublado",   "2d")
                add(date, 21, 15, "Sala 1", "Clube",        "legendado", "2d")
            else:         # Fri–Sun
                add(date, 12,  0, "Sala 1", "Se7en",        "legendado", "2d")
                add(date, 15,  5, "Sala 1", "Rede Social",  "dublado",   "2d")
                add(date, 18, 10, "Sala 1", "Clube",        "dublado",   "2d")
                add(date, 21, 15, "Sala 1", "Inocentes",    "legendado", "2d")
        else:
            if dow < 4:
                add(date, 12,  0, "Sala 1", "Clube",        "legendado", "2d")
                add(date, 15,  5, "Sala 1", "Se7en",        "dublado",   "2d")
                add(date, 18, 10, "Sala 1", "Rede Social",  "legendado", "2d")
                add(date, 21, 15, "Sala 1", "Inocentes",    "dublado",   "2d")
            else:
                add(date, 12,  0, "Sala 1", "Inocentes",    "dublado",   "2d")
                add(date, 15,  5, "Sala 1", "Clube",        "legendado", "2d")
                add(date, 18, 10, "Sala 1", "Se7en",        "legendado", "2d")
                add(date, 21, 15, "Sala 1", "Rede Social",  "dublado",   "2d")

        # ── SALA 2 (premium) ──────────────────────────────────────────────────
        # week-1: Batman (157 min) + A Origem (153) + Sonho (147) + Companheiros (151)
        #   12:00→14:37  15:05→17:38  18:10→20:37  21:15→23:46
        # week-2: A Origem (153) + Batman (157) + Companheiros (151) + Sonho (147)
        #   12:00→14:33  15:05→17:42  18:10→20:41  21:15→23:42
        if week == 0:
            stype_mon = "preview" if dow == 0 else "regular"
            add(date, 12,  0, "Sala 2", "Batman",        "legendado", "3d", stype_mon)
            add(date, 15,  5, "Sala 2", "Origem",        "legendado", "3d")
            add(date, 18, 10, "Sala 2", "Sonho",         "dublado",   "3d")
            add(date, 21, 15, "Sala 2", "Companheiros",  "legendado", "3d")
        else:
            stype_mon = "preview" if dow == 0 else "regular"
            add(date, 12,  0, "Sala 2", "Origem",        "legendado", "3d", stype_mon)
            add(date, 15,  5, "Sala 2", "Batman",        "dublado",   "3d")
            add(date, 18, 10, "Sala 2", "Companheiros",  "dublado",   "3d")
            add(date, 21, 15, "Sala 2", "Sonho",         "legendado", "3d")

        # ── SALA 3 (IMAX) ─────────────────────────────────────────────────────
        # week-1 Mon–Thu: A Origem (153) + Batman (157) alternating 4 slots
        #   12:00→14:33  15:05→17:42  18:10→20:43  21:15→23:52
        # week-1 Fri–Sun: O Senhor dos Anéis (183 min) – 3 slots (adjusted times)
        #   12:00→15:03  15:30→18:33  19:00→22:03
        # week-2 Mon–Thu: A Lista de Schindler (200 min) + A Origem – 3 slots
        #   12:00→15:20  15:45→18:18  18:45→22:05
        # week-2 Fri–Sun: Batman (157) + A Origem (153) – 4 slots
        #   12:00→14:37  15:05→17:38  18:10→20:47  21:15→23:48
        if week == 0:
            if dow < 4:
                add(date, 12,  0, "Sala 3", "Origem",  "legendado", "imax")
                add(date, 15,  5, "Sala 3", "Batman",  "legendado", "imax")
                add(date, 18, 10, "Sala 3", "Origem",  "dublado",   "imax")
                add(date, 21, 15, "Sala 3", "Batman",  "dublado",   "imax")
            else:
                add(date, 12,  0, "Sala 3", "Senhor",  "legendado", "imax")
                add(date, 15, 30, "Sala 3", "Senhor",  "legendado", "imax")
                add(date, 19,  0, "Sala 3", "Senhor",  "dublado",   "imax")
        else:
            if dow < 4:
                add(date, 12,  0, "Sala 3", "Schindler", "legendado", "imax")
                add(date, 15, 45, "Sala 3", "Origem",    "legendado", "imax")
                add(date, 18, 45, "Sala 3", "Schindler", "legendado", "imax")
            else:
                stype = "special_event" if dow == 4 else "regular"
                add(date, 12,  0, "Sala 3", "Batman",  "dublado",   "imax", stype)
                add(date, 15,  5, "Sala 3", "Origem",  "dublado",   "imax")
                add(date, 18, 10, "Sala 3", "Batman",  "legendado", "imax")
                add(date, 21, 15, "Sala 3", "Origem",  "legendado", "imax")

        # ── SALA 4 (standard) ─────────────────────────────────────────────────
        # week-1 Mon–Thu: O Poderoso Chefão (180 min) – 3 slots (long movie)
        #   12:00→15:00  15:30→18:30  19:00→22:00
        # week-1 Fri–Sun: A Rede Social + Se7en – same titles as Sala 1 (different room!)
        #   12:00→14:05  15:05→17:17  18:10→20:15  21:15→23:27
        # week-2 Mon–Thu: A Rede Social + O Iluminado alternating
        #   12:00→14:05  15:05→17:36  18:10→20:15  21:15→23:46
        # week-2 Fri–Sun: Se7en + Clube da Luta – same titles as Sala 1 (different room!)
        #   12:00→14:12  15:05→17:29  18:10→20:22  21:15→23:39
        if week == 0:
            if dow < 4:
                add(date, 12,  0, "Sala 4", "Poderoso",    "legendado", "2d")
                add(date, 15, 30, "Sala 4", "Poderoso",    "legendado", "2d")
                add(date, 19,  0, "Sala 4", "Poderoso",    "dublado",   "2d")
            else:
                add(date, 12,  0, "Sala 4", "Rede Social", "dublado",   "2d")
                add(date, 15,  5, "Sala 4", "Se7en",       "original",  "2d")
                add(date, 18, 10, "Sala 4", "Rede Social", "original",  "2d")
                add(date, 21, 15, "Sala 4", "Se7en",       "dublado",   "2d")
        else:
            if dow < 4:
                add(date, 12,  0, "Sala 4", "Rede Social", "original",  "2d")
                add(date, 15,  5, "Sala 4", "Iluminado",   "legendado", "2d")
                add(date, 18, 10, "Sala 4", "Rede Social", "dublado",   "2d")
                add(date, 21, 15, "Sala 4", "Iluminado",   "dublado",   "2d")
            else:
                add(date, 12,  0, "Sala 4", "Se7en",  "legendado", "2d")
                add(date, 15,  5, "Sala 4", "Clube",   "legendado", "2d")
                add(date, 18, 10, "Sala 4", "Se7en",   "dublado",   "2d")
                add(date, 21, 15, "Sala 4", "Clube",   "dublado",   "2d")


def remove_sessions(apps, schema_editor):
    Session = apps.get_model("catalog", "Session")
    Session.objects.filter(
        start_time__date__gte=datetime.date(2026, 6, 16),
        start_time__date__lte=datetime.date(2026, 6, 29),
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0014_movie_interest"),
    ]

    operations = [
        migrations.RunPython(seed_sessions, reverse_code=remove_sessions),
    ]
