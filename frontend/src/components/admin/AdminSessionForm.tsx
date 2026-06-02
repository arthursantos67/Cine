"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState, type FormEvent } from "react";

import { adminApi, type AdminSessionWritePayload } from "@/api/admin";
import { ApiError } from "@/api/client";
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

type FieldErrors = Partial<
  Record<keyof AdminSessionWritePayload | "non_field_errors", string>
>;

type AdminSessionFormProps = {
  session?: AdminSession;
};

const AUDIO_FORMAT_OPTIONS = [
  { label: "Original", value: "original" },
  { label: "Legendado", value: "legendado" },
  { label: "Dublado", value: "dublado" },
];

const PROJECTION_FORMAT_OPTIONS = [
  { label: "2D", value: "2d" },
  { label: "3D", value: "3d" },
  { label: "IMAX", value: "imax" },
];

const SESSION_TYPE_OPTIONS = [
  { label: "Regular", value: "regular" },
  { label: "Pré-estreia", value: "preview" },
  { label: "Evento especial", value: "special_event" },
];

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
  const [basePrice, setBasePrice] = useState(session?.base_price ?? "");
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
  const basePriceId = useId();

  useEffect(() => {
    Promise.all([adminApi.listMovies({ page: 1 }), adminApi.listRooms()])
      .then(([moviesRes, roomsRes]) => {
        setMovies(moviesRes.results);
        setRooms(roomsRes.results);
      })
      .catch(() => {
        setGlobalError("Não foi possível carregar filmes e salas.");
      })
      .finally(() => setLoadingOptions(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGlobalError(null);
    setConflictError(null);
    setIsSubmitting(true);

    const payload: AdminSessionWritePayload = {
      audio_format: audioFormat || undefined,
      base_price: basePrice,
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
        const msg =
          err instanceof ApiError ? err.message : String(err);
        setConflictError(
          `Conflito de horário: ${msg}. Escolha outro horário ou sala para esta sessão.`
        );
        return;
      }

      const errors = extractSessionFieldErrors(err);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setGlobalError("Corrija os erros indicados e tente novamente.");
      } else if (err instanceof ApiError) {
        setGlobalError(`Erro: ${err.message}`);
      } else {
        setGlobalError("Não foi possível salvar a sessão. Tente novamente.");
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
            Conflito de agenda detectado
          </p>
          <p className="mt-1 text-sm text-[#fcd34d]/80">{conflictError}</p>
        </div>
      ) : null}

      {locked ? (
        <div className="rounded-[8px] border border-white/10 bg-white/[0.04] px-4 py-3">
          <p className="text-sm font-bold text-white/70">
            Sessão com reservas ou compras ativas
          </p>
          <p className="mt-1 text-xs text-white/40">
            Filme, sala, horários e preço não podem ser alterados pois esta
            sessão já possui assentos reservados ou comprados. Você pode
            atualizar apenas os metadados opcionais (formato, áudio, tipo).
          </p>
        </div>
      ) : null}

      {!isEditing ? (
        <div className="rounded-[8px] border border-brand/20 bg-brand/5 px-4 py-3">
          <p className="text-sm font-bold text-brand/80">
            Geração automática de assentos
          </p>
          <p className="mt-1 text-xs text-white/50">
            Ao criar esta sessão, os assentos serão gerados automaticamente com
            base no layout atual da sala selecionada. Alterações futuras no
            layout da sala não afetarão sessões já criadas.
          </p>
        </div>
      ) : null}

      <Select
        disabled={formDisabled || locked}
        error={fieldErrors.movie}
        id={movieSelectId}
        label="Filme"
        onChange={(e) => setMovieId(e.target.value)}
        options={movieOptions}
        placeholder={loadingOptions ? "Carregando..." : "Selecione um filme"}
        required
        value={movieId}
      />

      <Select
        disabled={formDisabled || locked}
        error={fieldErrors.room}
        id={roomSelectId}
        label="Sala"
        onChange={(e) => setRoomId(e.target.value)}
        options={roomOptions}
        placeholder={loadingOptions ? "Carregando..." : "Selecione uma sala"}
        required
        value={roomId}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          error={fieldErrors.start_time}
          hint="Data e hora de início da sessão."
          label="Início"
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
          hint="Data e hora de término."
          label="Fim"
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

      <FormField
        error={fieldErrors.base_price}
        hint="Valor inteiro do ingresso para esta sessão (em R$)."
        label="Preço base (R$)"
        labelFor={basePriceId}
      >
        <TextInput
          disabled={formDisabled || locked}
          error={fieldErrors.base_price}
          id={basePriceId}
          min="0.01"
          onChange={(e) => setBasePrice(e.target.value)}
          placeholder="Ex.: 54.00"
          required
          step="0.01"
          type="number"
          value={basePrice}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          disabled={formDisabled}
          error={fieldErrors.audio_format}
          label="Formato de áudio"
          onChange={(e) => setAudioFormat(e.target.value as CatalogAudioFormat)}
          options={AUDIO_FORMAT_OPTIONS}
          placeholder="Não especificado"
          value={audioFormat}
        />

        <Select
          disabled={formDisabled}
          error={fieldErrors.projection_format}
          label="Projeção"
          onChange={(e) =>
            setProjectionFormat(e.target.value as CatalogProjectionFormat)
          }
          options={PROJECTION_FORMAT_OPTIONS}
          placeholder="Não especificado"
          value={projectionFormat}
        />

        <Select
          disabled={formDisabled}
          error={fieldErrors.session_type}
          label="Tipo de sessão"
          onChange={(e) => setSessionType(e.target.value as CatalogSessionType)}
          options={SESSION_TYPE_OPTIONS}
          placeholder="Não especificado"
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
          Cancelar
        </Button>
        <Button isLoading={isSubmitting} type="submit" variant="primary">
          {isEditing ? "Salvar alterações" : "Criar sessão"}
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
