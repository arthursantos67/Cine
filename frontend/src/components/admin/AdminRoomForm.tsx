"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { adminApi, type AdminRoomWritePayload } from "@/api/admin";
import { ApiError, getApiErrorUserMessage } from "@/api/client";
import type { AdminRoom, CatalogRoomExperienceType } from "@/types/catalog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { useI18n } from "@/i18n";

type FieldErrors = Partial<
  Record<keyof AdminRoomWritePayload | "non_field_errors", string>
>;

type AdminRoomFormProps = {
  room?: AdminRoom;
};

export function extractRoomFieldErrors(error: unknown): FieldErrors {
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

function Textarea({
  error,
  id,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea
      aria-invalid={error ? "true" : undefined}
      className={[
        "w-full rounded-control border bg-surface px-3 py-2 min-h-[100px]",
        "text-sm text-white placeholder:text-white/30 outline-none transition resize-y",
        "focus:border-brand focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-[0.68]",
        error ? "border-error" : "border-border",
      ].join(" ")}
      id={id}
      {...props}
    />
  );
}

export function AdminRoomForm({ room }: AdminRoomFormProps) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const isEditing = room !== undefined;

  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(
    room?.capacity ? String(room.capacity) : ""
  );
  const [experienceType, setExperienceType] = useState<
    CatalogRoomExperienceType
  >((room?.experience_type as CatalogRoomExperienceType) ?? "");
  const [displayName, setDisplayName] = useState(room?.display_name ?? "");
  const [description, setDescription] = useState(room?.description ?? "");
  const [ptDisplayName, setPtDisplayName] = useState(
    room?.translations?.["pt-BR"]?.display_name ?? ""
  );
  const [ptDescription, setPtDescription] = useState(
    room?.translations?.["pt-BR"]?.description ?? ""
  );
  const [englishDisplayName, setEnglishDisplayName] = useState(
    room?.translations?.["en-US"]?.display_name ?? ""
  );
  const [englishDescription, setEnglishDescription] = useState(
    room?.translations?.["en-US"]?.description ?? ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);

  const nameId = useId();
  const capacityId = useId();
  const displayNameId = useId();
  const descriptionId = useId();
  const ptDisplayNameId = useId();
  const ptDescriptionId = useId();
  const englishDisplayNameId = useId();
  const englishDescriptionId = useId();

  const experienceOptions = [
    { label: t("domain.roomExperience.standard"), value: "standard" },
    { label: t("domain.roomExperience.vip"), value: "vip" },
    { label: t("domain.roomExperience.premium"), value: "premium" },
    { label: t("domain.roomExperience.imax"), value: "imax" },
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setGlobalError(null);
    setIsSubmitting(true);

    const payload: AdminRoomWritePayload = {
      capacity: Number(capacity),
      description: description || undefined,
      display_name: displayName || undefined,
      experience_type: experienceType || undefined,
      name,
      translations: {
        "pt-BR": {
          description: ptDescription,
          display_name: ptDisplayName,
        },
        "en-US": {
          description: englishDescription,
          display_name: englishDisplayName,
        },
      },
    };

    try {
      if (isEditing) {
        await adminApi.updateRoom(room.id, payload);
      } else {
        await adminApi.createRoom(payload);
      }
      router.push("/admin/rooms");
      router.refresh();
    } catch (err) {
      const errors = extractRoomFieldErrors(err);
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

      <FormField error={fieldErrors.name} label={t("admin.room.name")} labelFor={nameId}>
        <TextInput
          disabled={isSubmitting}
          error={fieldErrors.name}
          id={nameId}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("admin.room.namePlaceholder")}
          required
          value={name}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          error={fieldErrors.capacity}
          hint={t("admin.room.capacityHint")}
          label={t("admin.room.capacity")}
          labelFor={capacityId}
        >
          <TextInput
            disabled={isSubmitting}
            error={fieldErrors.capacity}
            id={capacityId}
            min={1}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder={t("admin.room.capacityPlaceholder")}
            required
            type="number"
            value={capacity}
          />
        </FormField>

        <Select
          disabled={isSubmitting}
          error={fieldErrors.experience_type}
          label={t("admin.room.experienceType")}
          onChange={(e) =>
            setExperienceType(e.target.value as CatalogRoomExperienceType)
          }
          options={experienceOptions}
          placeholder={t("common.notSpecified")}
          value={experienceType}
        />
      </div>

      <FormField
        error={fieldErrors.display_name}
        hint={t("admin.room.displayNameHint")}
        label={t("admin.room.displayName")}
        labelFor={displayNameId}
      >
        <TextInput
          disabled={isSubmitting}
          error={fieldErrors.display_name}
          id={displayNameId}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={t("admin.room.displayNamePlaceholder")}
          value={displayName}
        />
      </FormField>

      <FormField
        error={fieldErrors.description}
        label={t("admin.room.description")}
        labelFor={descriptionId}
      >
        <Textarea
          disabled={isSubmitting}
          error={fieldErrors.description}
          id={descriptionId}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("admin.room.descriptionPlaceholder")}
          value={description}
        />
      </FormField>

      <fieldset className="grid gap-4 rounded-[8px] border border-white/[0.08] p-4">
        <legend className="px-1 text-sm font-extrabold text-white">
          {t("admin.room.translations")}
        </legend>
        <FormField
          error={fieldErrors.translations}
          label={t("admin.room.translationPtDisplayName")}
          labelFor={ptDisplayNameId}
        >
          <TextInput
            disabled={isSubmitting}
            error={fieldErrors.translations}
            id={ptDisplayNameId}
            onChange={(e) => setPtDisplayName(e.target.value)}
            placeholder={t("admin.room.displayNamePlaceholder")}
            value={ptDisplayName}
          />
        </FormField>
        <FormField
          error={fieldErrors.translations}
          label={t("admin.room.translationPtDescription")}
          labelFor={ptDescriptionId}
        >
          <Textarea
            disabled={isSubmitting}
            error={fieldErrors.translations}
            id={ptDescriptionId}
            onChange={(e) => setPtDescription(e.target.value)}
            placeholder={t("admin.room.descriptionPlaceholder")}
            value={ptDescription}
          />
        </FormField>
        <FormField
          error={fieldErrors.translations}
          label={t("admin.room.translationEnDisplayName")}
          labelFor={englishDisplayNameId}
        >
          <TextInput
            disabled={isSubmitting}
            error={fieldErrors.translations}
            id={englishDisplayNameId}
            onChange={(e) => setEnglishDisplayName(e.target.value)}
            placeholder={t("admin.room.translationEnDisplayNamePlaceholder")}
            value={englishDisplayName}
          />
        </FormField>
        <FormField
          error={fieldErrors.translations}
          label={t("admin.room.translationEnDescription")}
          labelFor={englishDescriptionId}
        >
          <Textarea
            disabled={isSubmitting}
            error={fieldErrors.translations}
            id={englishDescriptionId}
            onChange={(e) => setEnglishDescription(e.target.value)}
            placeholder={t("admin.room.translationEnDescriptionPlaceholder")}
            value={englishDescription}
          />
        </FormField>
      </fieldset>

      <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4">
        <Button
          disabled={isSubmitting}
          onClick={() => router.push("/admin/rooms")}
          type="button"
          variant="ghost"
        >
          {t("admin.cancel")}
        </Button>
        <Button isLoading={isSubmitting} type="submit" variant="primary">
          {isEditing ? t("admin.saveChanges") : t("admin.room.create")}
        </Button>
      </div>
    </form>
  );
}
