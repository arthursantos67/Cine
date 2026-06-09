"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";

import { adminApi, type AdminSessionWritePayload } from "@/api/admin";
import { ApiError, getApiErrorUserMessage } from "@/api/client";
import type {
  AdminRoom,
  AdminSession,
  CatalogAudioFormat,
  CatalogMovieDetail,
  CatalogProjectionFormat,
  CatalogSessionType,
} from "@/types/catalog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useI18n } from "@/i18n";

type FieldErrors = Partial<
  Record<keyof AdminSessionWritePayload | "non_field_errors", string>
>;

type AdminSessionFormProps = {
  session?: AdminSession;
};

const WEEKEND_DAYS = new Set([0, 5, 6]); // Sun, Fri, Sat

function computeSessionPricePreview(
  roomBasePrice: string,
  startTime: string,
  formatCurrency: (value: number) => string
): string | null {
  if (!roomBasePrice || !startTime) return null;
  const day = new Date(startTime).getUTCDay();
  const multiplier = WEEKEND_DAYS.has(day) ? 1.24 : 1.0;
  return formatCurrency(Number(roomBasePrice) * multiplier);
}

export function extractSessionFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ApiError) || error.code !== "VALIDATION_FAILED") {
    return {};
  }

  const details = error.details as Record<string, unknown> | null;
  if (!details || typeof details !== "object") {
    return {};
  }

  const result: FieldErrors = {};

  for (const [key, val] of Object.entries(details)) {
    const messages = Array.isArray(val) ? val : [val];
    result[key as keyof FieldErrors] = messages.join(" ");
  }

  return result;
}

function isConflictError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 409 ||
      (error.status === 400 &&
        typeof error.message === "string" &&
        /overlap|conflict|horário|já existe/i.test(error.message)))
  );
}

function FormField({
  children,
  error,
  hint,
  label,
  labelFor,
}: {
  children: React.ReactNode;
  error?: string;
  hint?: string;
  label: string;
  labelFor: string;
}) {
  const errorId = error ? `${labelFor}-error` : undefined;

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-extrabold text-white" htmlFor={labelFor}>
        {label}
      </label>
      {hint ? <p className="text-xs text-white/40">{hint}</p> : null}
      {children}
      {error ? (
        <p className="text-sm font-bold text-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function TextInput({
  error,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      aria-invalid={error ? "true" : undefined}
      className={[
        "min-h-[var(--control-height-lg)] w-full rounded-control border bg-surface px-3 py-2",
        "text-sm text-white placeholder:text-white/30 outline-none transition",
        "focus:border-brand focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-[0.68]",
        error ? "border-error" : "border-border",
      ].join(" ")}
      id={id}
      {...props}
    />
  );
}

function isProtected(session?: AdminSession): boolean {
  return Boolean(session?.has_reservations || session?.has_purchases);
}

export function AdminSessionForm({ session }: AdminSessionFormProps) {
  const router = useRouter();
  const { formatCurrency, locale, t } = useI18n();
  const isEditing = session !== undefined;
  const locked = isProtected(session);

  const [movieId, setMovieId] = useState(session?.movie.id ?? "");
  const [roomId, setRoomId] = useState(session?.room.id ?? "");
  const [startTime, setStartTime] = useState(
    session ? toLocalDateTimeInput(session.start_time) : ""
  );
  const [endTime, setEndTime] = useState(
    session ? toLocalDateTimeInput(session.end_time) : ""
  );
  const [audioFormat, setAudioFormat] = useState<CatalogAudioFormat>(
    (session?.audio_format as CatalogAudioFormat) ?? ""
  );
  const [projectionFormat, setProjectionFormat] =
    useState<CatalogProjectionFormat>(
      (session?.projection_format as CatalogProjectionFormat) ?? ""
    );
  const [sessionType, setSessionType] = useState<CatalogSessionType>(
    (session?.session_type as CatalogSessionType) ?? ""
  );

  const [movies, setMovies] = useState<CatalogMovieDetail[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const movieSelectId = useId();
  const roomSelectId = useId();
  const startTimeId = useId();
  const endTimeId = useId();

  const audioFormatOptions = [
    { label: t("domain.audio.original"), value: "original" },
    { label: t("domain.audio.legendado"), value: "legendado" },
    { label: t("domain.audio.dublado"), value: "dublado" },
  ];
  const projectionFormatOptions = [
    { label: t("domain.projection.2d"), value: "2d" },
    { label: t("domain.projection.3d"), value: "3d" },
    { label: t("domain.projection.imax"), value: "imax" },
  ];
  const sessionTypeOptions = [
    { label: t("domain.sessionType.regular"), value: "regular" },
    { label: t("domain.sessionType.preview"), value: "preview" },
    { label: t("domain.sessionType.special_event"), value: "special_event" },
  ];

  useEffect(() => {
    Promise.all([adminApi.listMovies({ page: 1 }), adminApi.listRooms()])
      .then(([moviesRes, roomsRes]) => {
        setMovies(moviesRes.results);
        setRooms(roomsRes.results);
      })
      .catch(() => {
        setGlobalError(t("admin.session.formLoadError"));
      })
      .finally(() => setLoadingOptions(false));
  }, [t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGlobalError(null);
    setConflictError(null);
    setIsSubmitting(true);

    const payload: AdminSessionWritePayload = {
      audio_format: audioFormat || undefined,
      end_time: toISOString(endTime),
      movie: movieId,
      projection_format: projectionFormat || undefined,
      room: roomId,
      session_type: sessionType || undefined,
      start_time: toISOString(startTime),
    };

    try {
      if (isEditing) {
        await adminApi.updateSession(session.id, payload);
      } else {
        await adminApi.createSession(payload);
      }
      router.push("/admin/sessions");
      router.refresh();
    } catch (err) {
      if (isConflictError(err)) {
        setConflictError(
          t("admin.session.conflictDescription", {
            message: getApiErrorUserMessage(err, locale),
          })
        );
        return;
      }

      const errors = extractSessionFieldErrors(err);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setGlobalError(t("admin.error.fixFields"));
      } else {
        setGlobalError(getApiErrorUserMessage(err, locale));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const movieOptions = movies.map((m) => ({ label: m.title, value: m.id }));
  const roomOptions = rooms.map((r) => ({
    label: r.display_name ? `${r.name} — ${r.display_name}` : r.name,
    value: r.id,
  }));

  const formDisabled = isSubmitting || loadingOptions;

  return (
    <form className="grid max-w-2xl gap-6" onSubmit={handleSubmit}>
      {globalError ? (
        <p
          className="rounded-[8px] border border-error/30 bg-error/10 px-4 py-3 text-sm font-bold text-error"
          role="alert"
        >
          {globalError}
        </p>
      ) : null}

      {fieldErrors.non_field_errors ? (
        <p
          className="rounded-[8px] border border-error/30 bg-error/10 px-4 py-3 text-sm font-bold text-error"
          role="alert"
        >
          {fieldErrors.non_field_errors}
        </p>
      ) : null}

      {conflictError ? (
        <div
          className="rounded-[8px] border border-[#b45309]/30 bg-[#92400e]/10 px-4 py-3"
          role="alert"
        >
          <p className="text-sm font-bold text-[#fbbf24]">
            {t("admin.session.conflictTitle")}
          </p>
          <p className="mt-1 text-sm text-[#fcd34d]/80">{conflictError}</p>
        </div>
      ) : null}

      {locked ? (
        <div className="rounded-[8px] border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-sm font-bold text-white/70">
            {t("admin.session.lockedTitle")}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {t("admin.session.lockedDescription")}
          </p>
        </div>
      ) : null}

      {!isEditing ? (
        <div className="rounded-[8px] border border-brand/20 bg-brand/5 px-4 py-3">
          <p className="text-sm font-bold text-brand/80">
            {t("admin.session.autoSeatsTitle")}
          </p>
          <p className="mt-1 text-xs text-white/50">
            {t("admin.session.autoSeatsDescription")}
          </p>
        </div>
      ) : null}

      <Select
        disabled={formDisabled || locked}
        error={fieldErrors.movie}
        id={movieSelectId}
        label={t("admin.session.movie")}
        onChange={(e) => setMovieId(e.target.value)}
        options={movieOptions}
        placeholder={
          loadingOptions
            ? t("common.loadingEllipsis")
            : t("admin.session.moviePlaceholder")
        }
        required
        value={movieId}
      />

      <Select
        disabled={formDisabled || locked}
        error={fieldErrors.room}
        id={roomSelectId}
        label={t("admin.session.room")}
        onChange={(e) => setRoomId(e.target.value)}
        options={roomOptions}
        placeholder={
          loadingOptions
            ? t("common.loadingEllipsis")
            : t("admin.session.roomPlaceholder")
        }
        required
        value={roomId}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          error={fieldErrors.start_time}
          hint={t("admin.session.startHint")}
          label={t("admin.session.start")}
          labelFor={startTimeId}
        >
          <TextInput
            disabled={formDisabled || locked}
            error={fieldErrors.start_time}
            id={startTimeId}
            onChange={(e) => setStartTime(e.target.value)}
            required
            type="datetime-local"
            value={startTime}
          />
        </FormField>

        <FormField
          error={fieldErrors.end_time}
          hint={t("admin.session.endHint")}
          label={t("admin.session.end")}
          labelFor={endTimeId}
        >
          <TextInput
            disabled={formDisabled || locked}
            error={fieldErrors.end_time}
            id={endTimeId}
            onChange={(e) => setEndTime(e.target.value)}
            required
            type="datetime-local"
            value={endTime}
          />
        </FormField>
      </div>

      {(() => {
        const selectedRoom = rooms.find((r) => r.id === roomId);
        const preview =
          selectedRoom?.base_price
            ? computeSessionPricePreview(selectedRoom.base_price, startTime, formatCurrency)
            : null;
        return (
          <div className="grid gap-1.5">
            <span className="text-sm font-extrabold text-white">
              {t("admin.session.calculatedPrice")}
            </span>
            <p className="text-xs text-white/40">
              {t("admin.session.calculatedPriceHelp")}
            </p>
            {preview ? (
              <p className="inline-flex w-fit items-center rounded-md border border-brand/50 bg-brand/20 px-3 py-1.5 text-base font-extrabold text-white">
                {preview}
              </p>
            ) : (
              <p className="text-sm text-white/40">
                {t("admin.session.selectPriceHelp")}
              </p>
            )}
          </div>
        );
      })()}

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          disabled={formDisabled}
          error={fieldErrors.audio_format}
          label={t("admin.session.audioFormat")}
          onChange={(e) => setAudioFormat(e.target.value as CatalogAudioFormat)}
          options={audioFormatOptions}
          placeholder={t("common.notSpecified")}
          value={audioFormat}
        />

        <Select
          disabled={formDisabled}
          error={fieldErrors.projection_format}
          label={t("admin.session.projection")}
          onChange={(e) =>
            setProjectionFormat(e.target.value as CatalogProjectionFormat)
          }
          options={projectionFormatOptions}
          placeholder={t("common.notSpecified")}
          value={projectionFormat}
        />

        <Select
          disabled={formDisabled}
          error={fieldErrors.session_type}
          label={t("admin.session.type")}
          onChange={(e) => setSessionType(e.target.value as CatalogSessionType)}
          options={sessionTypeOptions}
          placeholder={t("common.notSpecified")}
          value={sessionType}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4">
        <Button
          disabled={isSubmitting}
          onClick={() => router.push("/admin/sessions")}
          type="button"
          variant="ghost"
        >
          {t("admin.cancel")}
        </Button>
        <Button isLoading={isSubmitting} type="submit" variant="primary">
          {isEditing ? t("admin.saveChanges") : t("admin.session.create")}
        </Button>
      </div>
    </form>
  );
}

function toLocalDateTimeInput(isoString: string): string {
  const date = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toISOString(localDateTimeInput: string): string {
  return new Date(localDateTimeInput).toISOString();
}
