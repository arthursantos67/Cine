"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { adminApi, type AdminRoomWritePayload } from "@/api/admin";
import { ApiError, getApiErrorUserMessage } from "@/api/client";
import type { AdminRoom, CatalogRoomExperienceType } from "@/types/catalog";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { useI18n } from "@/i18n";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/locales";

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
  const [maxCenterSeats, setMaxCenterSeats] = useState(
    room?.max_center_seats_per_row != null ? String(room.max_center_seats_per_row) : ""
  );
  const [experienceType, setExperienceType] = useState<CatalogRoomExperienceType>(
    (room?.experience_type as CatalogRoomExperienceType) ?? ""
  );
  const [displayName, setDisplayName] = useState(room?.display_name ?? "");
  const [displayNameLocale, setDisplayNameLocale] = useState<Locale>(locale);
  const [description, setDescription] = useState(room?.description ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [pendingPayload, setPendingPayload] = useState<AdminRoomWritePayload | null>(null);

  const nameId = useId();
  const capacityId = useId();
  const maxCenterSeatsId = useId();
  const displayNameId = useId();
  const descriptionId = useId();

  const experienceOptions = [
    { label: t("domain.roomExperience.standard"), value: "standard" },
    { label: t("domain.roomExperience.vip"), value: "vip" },
    { label: t("domain.roomExperience.premium"), value: "premium" },
    { label: t("domain.roomExperience.imax"), value: "imax" },
  ];

  const localeSelectClass = [
    "min-h-[var(--control-height-lg)] rounded-control border border-border bg-surface px-2 py-1.5",
    "text-sm text-white outline-none transition focus:border-brand focus:shadow-focus",
  ].join(" ");

  async function submitPayload(payload: AdminRoomWritePayload) {
    setFieldErrors({});
    setGlobalError(null);
    setIsSubmitting(true);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: AdminRoomWritePayload = {
      capacity: Number(capacity),
      max_center_seats_per_row: maxCenterSeats && Number(maxCenterSeats) > 0 ? Number(maxCenterSeats) : null,
      description: description || undefined,
      display_name: displayName || undefined,
      experience_type: experienceType || undefined,
      name,
      source_language: displayName ? displayNameLocale : undefined,
    };

    if (isEditing && displayName && displayName !== (room.display_name ?? "")) {
      setPendingPayload(payload);
      return;
    }

    void submitPayload(payload);
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
        hint={t("admin.room.maxCenterSeatsHint")}
        label={t("admin.room.maxCenterSeats")}
        labelFor={maxCenterSeatsId}
      >
        <TextInput
          disabled={isSubmitting}
          id={maxCenterSeatsId}
          min={1}
          onChange={(e) => setMaxCenterSeats(e.target.value)}
          placeholder={t("admin.room.maxCenterSeatsPlaceholder")}
          type="number"
          value={maxCenterSeats}
        />
      </FormField>

      <FormField
        error={fieldErrors.display_name}
        hint={t("admin.room.displayNameHint")}
        label={t("admin.room.displayName")}
        labelFor={displayNameId}
      >
        <div className="flex gap-2">
          <TextInput
            disabled={isSubmitting}
            error={fieldErrors.display_name}
            id={displayNameId}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("admin.room.displayNamePlaceholder")}
            value={displayName}
          />
          <select
            aria-label={t("admin.room.sourceLanguage")}
            className={localeSelectClass}
            disabled={isSubmitting || !displayName}
            onChange={(e) => setDisplayNameLocale(e.target.value as Locale)}
            value={displayNameLocale}
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <option key={loc} value={loc}>
                {t(`language.${loc}`)}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[11px] text-white/35">{t("admin.room.autoTranslateHint")}</p>
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

      <AdminConfirmDialog
        confirmLabel={t("admin.room.retranslateConfirm")}
        description={t("admin.room.retranslateDescription")}
        isOpen={pendingPayload !== null}
        onCancel={() => setPendingPayload(null)}
        onConfirm={() => {
          const p = pendingPayload;
          setPendingPayload(null);
          if (p) void submitPayload(p);
        }}
        title={t("admin.room.retranslateTitle")}
        tone="default"
      />
    </form>
  );
}
