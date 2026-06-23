import type {
  CatalogMovie,
  CatalogRoomExperienceType,
  CatalogRoomSummary,
  CatalogSession,
} from "@/types/catalog";
import { DEFAULT_LOCALE, type Locale, resolveLocale } from "@/i18n/locales";
import { messages } from "@/i18n/messages";
import { formatCurrency } from "@/utils/formatters";

export const sessionTimeZone = "America/Fortaleza";

export type SessionDateOption = {
  label: string;
  value: string;
  weekday: string;
};

export type SessionRoomGroup = {
  roomId: string;
  roomName: string;
  sessions: CatalogSession[];
};

export type SessionBadge = {
  label: string;
};

export function buildSessionDateOptions(
  startDate: Date,
  dayCount = 7,
  locale: Locale | string = DEFAULT_LOCALE
): SessionDateOption[] {
  const startDateValue = formatDateForSessionQuery(startDate);

  return Array.from({ length: dayCount }, (_, offset) => {
    const value = addDaysToDateValue(startDateValue, offset);

    return {
      label: formatSessionDateLabel(value, locale),
      value,
      weekday: formatSessionWeekday(value, locale),
    };
  });
}

export function formatDateForSessionQuery(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: sessionTimeZone,
    year: "numeric",
  }).formatToParts(date);

  return `${getDatePart(parts, "year")}-${getDatePart(parts, "month")}-${getDatePart(parts, "day")}`;
}

export function formatSessionDateLabel(
  dateValue: string,
  locale: Locale | string = DEFAULT_LOCALE
) {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  }).format(parseSessionDateValue(dateValue));
}

export function formatSessionFullDate(
  dateValue: string,
  locale: Locale | string = DEFAULT_LOCALE
) {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(parseSessionDateValue(dateValue));
}

export function formatSessionTime(
  value: string,
  locale: Locale | string = DEFAULT_LOCALE
) {
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: sessionTimeZone,
  }).format(new Date(value));
}

export function formatSessionPrice(
  value: string,
  locale: Locale | string = DEFAULT_LOCALE
) {
  return formatCurrency(Number(value), locale);
}

export function getRoomDisplayName(room: CatalogRoomSummary) {
  return room.display_name?.trim() || room.name;
}

export function getSessionBadges(
  session: CatalogSession,
  locale: Locale | string = DEFAULT_LOCALE
): SessionBadge[] {
  const labels = [
    getMetadataLabel("roomExperience", session.room.experience_type, locale),
    getMetadataLabel("projection", session.projection_format, locale),
    getMetadataLabel("audio", session.audio_format, locale),
    getMetadataLabel("sessionType", session.session_type, locale),
  ];
  const uniqueLabels = labels.filter(
    (label, index): label is string =>
      Boolean(label) && labels.indexOf(label) === index
  );

  return uniqueLabels.map((label) => ({ label }));
}

export function getSessionSeatsHref(sessionId: string) {
  return `/sessions/${sessionId}/seats`;
}

const SESSION_PRESALE_CUTOFF_MINUTES = 15;

export function isSessionPurchasable(session: CatalogSession, now = new Date()): boolean {
  const cutoff = new Date(session.start_time);
  cutoff.setMinutes(cutoff.getMinutes() - SESSION_PRESALE_CUTOFF_MINUTES);
  return now < cutoff;
}

export type MovieSessionGroup = {
  movie: CatalogMovie;
  roomGroups: SessionRoomGroup[];
};

export function groupSessionsByMovie(
  sessions: CatalogSession[]
): MovieSessionGroup[] {
  const movieMap = new Map<string, { movie: CatalogMovie; sessions: CatalogSession[] }>();

  for (const s of sessions) {
    const existing = movieMap.get(s.movie.id);
    if (existing) {
      existing.sessions.push(s);
    } else {
      movieMap.set(s.movie.id, { movie: s.movie, sessions: [s] });
    }
  }

  return Array.from(movieMap.values()).map(({ movie, sessions: movieSessions }) => ({
    movie,
    roomGroups: groupSessionsByRoom(movieSessions),
  }));
}

export function groupSessionsByRoom(
  sessions: CatalogSession[]
): SessionRoomGroup[] {
  const groups = new Map<string, SessionRoomGroup>();

  for (const session of [...sessions].sort(compareSessionsByRoomAndTime)) {
    const roomId = session.room.id;
    const group = groups.get(roomId);

    if (group) {
      group.sessions.push(session);
      continue;
    }

    groups.set(roomId, {
      roomId,
      roomName: getRoomDisplayName(session.room),
      sessions: [session],
    });
  }

  return Array.from(groups.values());
}

function compareSessionsByRoomAndTime(
  first: CatalogSession,
  second: CatalogSession
) {
  const roomComparison = getRoomDisplayName(first.room).localeCompare(getRoomDisplayName(second.room));

  if (roomComparison !== 0) {
    return roomComparison;
  }

  return (
    new Date(first.start_time).getTime() - new Date(second.start_time).getTime()
  );
}

export function getRoomExperienceLabel(
  type: CatalogRoomExperienceType | null | undefined,
  locale: Locale | string = DEFAULT_LOCALE
): string {
  if (!type) return "";
  return getMetadataLabel("roomExperience", type, locale) ?? "";
}

export type ExperienceSessionGroup = {
  experienceType: CatalogRoomExperienceType;
  label: string;
  sessions: CatalogSession[];
};

export function groupSessionsByExperienceType(
  sessions: CatalogSession[],
  locale: Locale | string = DEFAULT_LOCALE
): ExperienceSessionGroup[] {
  const groups = new Map<string, ExperienceSessionGroup>();

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (const session of sorted) {
    const expType = (session.room.experience_type ?? "") as CatalogRoomExperienceType;
    const existing = groups.get(expType);
    if (existing) {
      existing.sessions.push(session);
    } else {
      groups.set(expType, {
        experienceType: expType,
        label:
          expType === "standard"
            ? t(locale, "domain.roomExperience.standardGroup")
            : getRoomExperienceLabel(expType, locale) || t(locale, "session.roomFallback"),
        sessions: [session],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.label.localeCompare(b.label, resolveLocale(locale))
  );
}

export function formatScheduleDateHeading(
  dateValue: string,
  today: Date = new Date(),
  locale: Locale | string = DEFAULT_LOCALE
): string {
  const todayValue = formatDateForSessionQuery(today);
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(today.getDate() + 1);
  const tomorrowValue = formatDateForSessionQuery(tomorrowDate);

  if (dateValue === todayValue) return t(locale, "session.today");
  if (dateValue === tomorrowValue) return t(locale, "session.tomorrow");

  return new Intl.DateTimeFormat(resolveLocale(locale), {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(`${dateValue}T00:00:00Z`));
}

function addDaysToDateValue(dateValue: string, days: number) {
  const [year, month, day] = parseDateParts(dateValue);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return date.toISOString().slice(0, 10);
}

function formatSessionWeekday(
  dateValue: string,
  locale: Locale | string = DEFAULT_LOCALE
) {
  const weekday = new Intl.DateTimeFormat(resolveLocale(locale), {
    timeZone: "UTC",
    weekday: "short",
  }).format(parseSessionDateValue(dateValue));

  return weekday.replace(".", "");
}

function getDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function parseSessionDateValue(dateValue: string) {
  const [year, month, day] = parseDateParts(dateValue);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function parseDateParts(dateValue: string) {
  return dateValue.split("-").map(Number) as [number, number, number];
}

function getMetadataLabel(
  domain: "audio" | "projection" | "roomExperience" | "sessionType",
  value: string | null | undefined,
  locale: Locale | string
) {
  if (!value) {
    return null;
  }

  return t(locale, `domain.${domain}.${value}`) ?? null;
}

function t(locale: Locale | string, key: string) {
  const resolvedLocale = resolveLocale(locale);
  return messages[resolvedLocale][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
}
