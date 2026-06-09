from django.utils import timezone

from cineprime_api.localization import (
    DEFAULT_LOCALE,
    format_email_datetime,
    get_translation_value,
    normalize_locale,
)


_EMAIL_COPY_EN = {
    "greeting": "Hello {username},",
    "intro": "Your checkout was completed successfully. Here are your tickets:",
    "ticket": "Ticket {index}",
    "movie": "Movie",
    "session": "Session",
    "room": "Room",
    "seat": "Seat",
    "ticket_code": "Ticket code",
    "footer": "Present the ticket codes at entry.",
    "thanks": "Thank you for choosing CinePrime.",
    "subject_one": "Ticket confirmation - 1 ticket",
    "subject_many": "Ticket confirmation - {count} tickets",
}

EMAIL_COPY = {
    "pt-BR": {
        "greeting": "Olá {username},",
        "intro": "Sua compra foi concluída com sucesso. Aqui estão seus ingressos:",
        "ticket": "Ingresso {index}",
        "movie": "Filme",
        "session": "Sessão",
        "room": "Sala",
        "seat": "Assento",
        "ticket_code": "Código do ingresso",
        "footer": "Apresente os códigos dos ingressos na entrada.",
        "thanks": "Obrigado por escolher o CinePrime.",
        "subject_one": "Confirmação de ingresso - 1 ingresso",
        "subject_many": "Confirmação de ingressos - {count} ingressos",
    },
    "en-US": _EMAIL_COPY_EN,
    "es-ES": _EMAIL_COPY_EN,
    "fr-FR": _EMAIL_COPY_EN,
    "de-DE": _EMAIL_COPY_EN,
    "it-IT": _EMAIL_COPY_EN,
    "zh-CN": _EMAIL_COPY_EN,
    "ja-JP": _EMAIL_COPY_EN,
}


def build_ticket_confirmation_email(*, user, tickets, locale=DEFAULT_LOCALE):
    locale = normalize_locale(locale) or DEFAULT_LOCALE
    copy = EMAIL_COPY.get(locale, EMAIL_COPY[DEFAULT_LOCALE])

    sorted_tickets = sorted(
        tickets,
        key=lambda ticket: (
            ticket.session_seat.session.start_time,
            ticket.session_seat.seat.row.name,
            ticket.session_seat.seat.number,
        ),
    )

    header_lines = [
        copy["greeting"].format(username=user.username),
        "",
        copy["intro"],
        "",
    ]

    ticket_lines = []
    for index, ticket in enumerate(sorted_tickets, start=1):
        session = ticket.session_seat.session
        start_time = timezone.localtime(session.start_time)
        seat = ticket.session_seat.seat
        movie_title = get_translation_value(
            fallback_value=session.movie.title,
            field="title",
            locale=locale,
            translations=session.movie.translations,
        )
        room_name = get_translation_value(
            fallback_value=session.room.display_name or session.room.name,
            field="display_name",
            locale=locale,
            translations=session.room.translations,
        )

        ticket_lines.extend(
            [
                copy["ticket"].format(index=index),
                f"{copy['movie']}: {movie_title}",
                f"{copy['session']}: {format_email_datetime(start_time, locale=locale)}",
                f"{copy['room']}: {room_name}",
                f"{copy['seat']}: {seat.row.name}{seat.number}",
                f"{copy['ticket_code']}: {ticket.ticket_code}",
                "",
            ]
        )

    footer_lines = [
        copy["footer"],
        "",
        copy["thanks"],
    ]

    subject_key = "subject_one" if len(sorted_tickets) == 1 else "subject_many"
    subject = copy[subject_key].format(count=len(sorted_tickets))
    body = "\n".join(header_lines + ticket_lines + footer_lines)

    return {
        "subject": subject,
        "body": body,
    }
