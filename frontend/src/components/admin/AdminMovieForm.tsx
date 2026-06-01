"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { adminApi, type AdminMovieWritePayload } from "@/api/admin";
import { ApiError } from "@/api/client";
import type { CatalogGenre, CatalogMovieDetail, CatalogMovieAgeRating, MovieStatus } from "@/types/catalog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

type FieldErrors = Partial<Record<keyof AdminMovieWritePayload | "non_field_errors", string>>;

type AdminMovieFormProps = {
  movie?: CatalogMovieDetail;
};

const STATUS_OPTIONS = [
  { label: "Em cartaz", value: "em_cartaz" },
  { label: "Pré-venda", value: "pre_venda" },
  { label: "Em breve", value: "em_breve" },
];

const AGE_RATING_OPTIONS = [
  { label: "Livre (L)", value: "L" },
  { label: "10 anos", value: "10" },
  { label: "12 anos", value: "12" },
  { label: "14 anos", value: "14" },
  { label: "16 anos", value: "16" },
  { label: "18 anos", value: "18" },
];

export function extractFieldErrors(error: unknown): FieldErrors {
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

function FormField({
  children,
  error,
  label,
  labelFor,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  labelFor: string;
}) {
  const errorId = error ? `${labelFor}-error` : undefined;

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-extrabold text-white" htmlFor={labelFor}>
        {label}
      </label>
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

function Textarea({
  error,
  id,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea
      aria-invalid={error ? "true" : undefined}
      className={[
        "w-full rounded-control border bg-surface px-3 py-2 min-h-[120px]",
        "text-sm text-white placeholder:text-white/30 outline-none transition resize-y",
        "focus:border-brand focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-[0.68]",
        error ? "border-error" : "border-border",
      ].join(" ")}
      id={id}
      {...props}
    />
  );
}

export function AdminMovieForm({ movie }: AdminMovieFormProps) {
  const router = useRouter();
  const isEditing = movie !== undefined;

  const [title, setTitle] = useState(movie?.title ?? "");
  const [synopsis, setSynopsis] = useState(movie?.synopsis ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    movie?.duration_minutes ? String(movie.duration_minutes) : ""
  );
  const [releaseDate, setReleaseDate] = useState(movie?.release_date ?? "");
  const [posterUrl, setPosterUrl] = useState(movie?.poster_url ?? "");
  const [status, setStatus] = useState<MovieStatus>(movie?.status ?? "em_cartaz");
  const [isFeatured, setIsFeatured] = useState(movie?.is_featured ?? false);
  const [ageRating, setAgeRating] = useState<CatalogMovieAgeRating>(
    (movie?.age_rating as CatalogMovieAgeRating) ?? ""
  );
  const [director, setDirector] = useState(movie?.director ?? "");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(
    movie?.genres.map((g) => g.id) ?? []
  );
  const [castMembers, setCastMembers] = useState<string[]>(movie?.cast ?? []);
  const [castInput, setCastInput] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [showNewGenreInput, setShowNewGenreInput] = useState(false);
  const [newGenreName, setNewGenreName] = useState("");
  const [isCreatingGenre, setIsCreatingGenre] = useState(false);
  const [localGenres, setLocalGenres] = useState<CatalogGenre[]>([]);
  const [genresLoading, setGenresLoading] = useState(true);

  const newGenreInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const synopsisId = useId();
  const durationId = useId();
  const releaseDateId = useId();
  const posterUrlId = useId();
  const directorId = useId();
  const castInputId = useId();

  useEffect(() => {
    adminApi.listGenres().then((res) => setLocalGenres(res.results)).catch(() => {}).finally(() => setGenresLoading(false));
  }, []);

  useEffect(() => {
    if (showNewGenreInput) {
      newGenreInputRef.current?.focus();
    }
  }, [showNewGenreInput]);

  function toggleGenre(genreId: string) {
    setSelectedGenreIds((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  }

  function addCastMember() {
    const name = castInput.trim();
    if (!name || castMembers.includes(name)) return;
    setCastMembers((prev) => [...prev, name]);
    setCastInput("");
  }

  function removeCastMember(name: string) {
    setCastMembers((prev) => prev.filter((m) => m !== name));
  }

  async function handleCreateGenre() {
    const name = newGenreName.trim();
    if (!name) return;

    setIsCreatingGenre(true);
    try {
      const created = await adminApi.createGenre({ name });
      setLocalGenres((prev) => [...prev, created]);
      setSelectedGenreIds((prev) => [...prev, created.id]);
      setNewGenreName("");
      setShowNewGenreInput(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === "VALIDATION_FAILED") {
        const details = err.details as Record<string, unknown> | null;
        const nameError = details?.name;
        const msg = Array.isArray(nameError) ? nameError[0] : String(nameError ?? "Nome inválido.");
        setGlobalError(`Erro ao criar gênero: ${msg}`);
      } else {
        setGlobalError("Não foi possível criar o gênero. Tente novamente.");
      }
    } finally {
      setIsCreatingGenre(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGlobalError(null);
    setIsSubmitting(true);

    const payload: AdminMovieWritePayload = {
      age_rating: ageRating || undefined,
      cast: castMembers,
      director: director || undefined,
      duration_minutes: Number(durationMinutes),
      genres: selectedGenreIds,
      is_featured: isFeatured,
      poster_url: posterUrl,
      release_date: releaseDate,
      status,
      synopsis,
      title,
    };

    try {
      if (isEditing) {
        await adminApi.updateMovie(movie.id, payload);
      } else {
        await adminApi.createMovie(payload);
      }
      router.push("/admin/movies");
      router.refresh();
    } catch (err) {
      const errors = extractFieldErrors(err);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setGlobalError("Corrija os erros indicados e tente novamente.");
      } else if (err instanceof ApiError) {
        setGlobalError(`Erro: ${err.message}`);
      } else {
        setGlobalError("Não foi possível salvar o filme. Tente novamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid gap-6" onSubmit={handleSubmit}>
      {globalError ? (
        <p className="rounded-[8px] border border-error/30 bg-error/10 px-4 py-3 text-sm font-bold text-error" role="alert">
          {globalError}
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left column */}
        <div className="grid gap-4 content-start">
          <FormField error={fieldErrors.title} label="Título" labelFor={titleId}>
            <TextInput
              disabled={isSubmitting}
              error={fieldErrors.title}
              id={titleId}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do filme"
              required
              value={title}
            />
          </FormField>

          <FormField error={fieldErrors.synopsis} label="Sinopse" labelFor={synopsisId}>
            <Textarea
              disabled={isSubmitting}
              error={fieldErrors.synopsis}
              id={synopsisId}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Descrição do filme..."
              required
              value={synopsis}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField error={fieldErrors.duration_minutes} label="Duração (min)" labelFor={durationId}>
              <TextInput
                disabled={isSubmitting}
                error={fieldErrors.duration_minutes}
                id={durationId}
                min={1}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="120"
                required
                type="number"
                value={durationMinutes}
              />
            </FormField>

            <FormField error={fieldErrors.release_date} label="Data de lançamento" labelFor={releaseDateId}>
              <TextInput
                disabled={isSubmitting}
                error={fieldErrors.release_date}
                id={releaseDateId}
                onChange={(e) => setReleaseDate(e.target.value)}
                required
                type="date"
                value={releaseDate}
              />
            </FormField>
          </div>

          <FormField error={fieldErrors.director} label="Direção" labelFor={directorId}>
            <TextInput
              disabled={isSubmitting}
              error={fieldErrors.director}
              id={directorId}
              onChange={(e) => setDirector(e.target.value)}
              placeholder="Nome do(a) diretor(a)"
              value={director}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              disabled={isSubmitting}
              error={fieldErrors.status}
              label="Status"
              onChange={(e) => setStatus(e.target.value as MovieStatus)}
              options={STATUS_OPTIONS}
              value={status}
            />

            <Select
              disabled={isSubmitting}
              error={fieldErrors.age_rating}
              label="Faixa etária"
              onChange={(e) => setAgeRating(e.target.value as CatalogMovieAgeRating)}
              options={AGE_RATING_OPTIONS}
              placeholder="Não classificado"
              value={ageRating}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              checked={isFeatured}
              className="h-4 w-4 accent-brand"
              disabled={isSubmitting}
              id="is_featured"
              onChange={(e) => setIsFeatured(e.target.checked)}
              type="checkbox"
            />
            <label className="text-sm font-extrabold text-white" htmlFor="is_featured">
              Destaque (exibir no carrossel principal)
            </label>
          </div>
        </div>

        {/* Right column */}
        <div className="grid gap-4 content-start">
          <FormField error={fieldErrors.poster_url} label="URL do Poster" labelFor={posterUrlId}>
            <TextInput
              disabled={isSubmitting}
              error={fieldErrors.poster_url}
              id={posterUrlId}
              onChange={(e) => setPosterUrl(e.target.value)}
              placeholder="https://..."
              required
              type="url"
              value={posterUrl}
            />
          </FormField>

          {posterUrl ? (
            <div className="overflow-hidden rounded-[8px] border border-white/[0.07]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="Prévia do poster"
                className="w-full object-cover"
                src={posterUrl}
                style={{ maxHeight: 280 }}
              />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-[8px] border border-dashed border-white/[0.12] text-sm text-white/30">
              Prévia do poster
            </div>
          )}

          {/* Genres */}
          <div className="grid gap-1.5">
            <span className="text-sm font-extrabold text-white">Gêneros</span>
            {fieldErrors.genres ? (
              <p className="text-sm font-bold text-error" role="alert">
                {fieldErrors.genres}
              </p>
            ) : null}
            {genresLoading ? (
              <div className="h-8 w-48 animate-pulse rounded-pill bg-white/[0.06]" />
            ) : null}
            <div className="flex flex-wrap gap-2">
              {localGenres.map((genre) => {
                const selected = selectedGenreIds.includes(genre.id);
                return (
                  <button
                    className={[
                      "rounded-pill border px-3 py-1 text-xs font-bold transition",
                      selected
                        ? "border-brand bg-brand/20 text-brand"
                        : "border-white/[0.12] bg-white/[0.04] text-white/60 hover:border-white/30 hover:text-white",
                    ].join(" ")}
                    disabled={isSubmitting}
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    type="button"
                  >
                    {genre.name}
                  </button>
                );
              })}

              {showNewGenreInput ? (
                <div className="flex items-center gap-1.5">
                  <input
                    className="h-7 rounded-control border border-brand/50 bg-brand/10 px-2 text-xs text-white outline-none focus:border-brand"
                    disabled={isCreatingGenre}
                    onChange={(e) => setNewGenreName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateGenre();
                      }
                      if (e.key === "Escape") {
                        setShowNewGenreInput(false);
                        setNewGenreName("");
                      }
                    }}
                    placeholder="Nome do gênero"
                    ref={newGenreInputRef}
                    value={newGenreName}
                  />
                  <Button
                    disabled={isCreatingGenre || !newGenreName.trim()}
                    isLoading={isCreatingGenre}
                    onClick={handleCreateGenre}
                    size="sm"
                    type="button"
                    variant="primary"
                  >
                    Criar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowNewGenreInput(false);
                      setNewGenreName("");
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <button
                  className="rounded-pill border border-dashed border-white/[0.15] px-3 py-1 text-xs font-bold text-white/40 transition hover:border-brand/50 hover:text-brand"
                  disabled={isSubmitting}
                  onClick={() => setShowNewGenreInput(true)}
                  type="button"
                >
                  + Novo gênero
                </button>
              )}
            </div>
          </div>

          {/* Cast */}
          <div className="grid gap-1.5">
            <label className="text-sm font-extrabold text-white" htmlFor={castInputId}>
              Elenco
            </label>
            {fieldErrors.cast ? (
              <p className="text-sm font-bold text-error" role="alert">
                {fieldErrors.cast}
              </p>
            ) : null}
            <div className="flex gap-2">
              <TextInput
                disabled={isSubmitting}
                id={castInputId}
                onChange={(e) => setCastInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCastMember();
                  }
                }}
                placeholder="Nome do ator / atriz"
                value={castInput}
              />
              <Button
                disabled={isSubmitting || !castInput.trim()}
                onClick={addCastMember}
                size="sm"
                type="button"
                variant="secondary"
              >
                Adicionar
              </Button>
            </div>
            {castMembers.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {castMembers.map((name) => (
                  <li
                    className="flex items-center gap-1.5 rounded-pill border border-white/[0.10] bg-white/[0.04] pl-3 pr-2 py-1 text-xs text-white/80"
                    key={name}
                  >
                    {name}
                    <button
                      aria-label={`Remover ${name}`}
                      className="text-white/40 transition hover:text-error"
                      disabled={isSubmitting}
                      onClick={() => removeCastMember(name)}
                      type="button"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4">
        <Button
          disabled={isSubmitting}
          onClick={() => router.push("/admin/movies")}
          type="button"
          variant="ghost"
        >
          Cancelar
        </Button>
        <Button isLoading={isSubmitting} type="submit" variant="primary">
          {isEditing ? "Salvar alterações" : "Criar filme"}
        </Button>
      </div>
    </form>
  );
}
