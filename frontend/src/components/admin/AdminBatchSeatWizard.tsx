"use client";

import { useState } from "react";

import { adminApi, type AdminBulkLayoutCreatedRow } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n";

type Step = "configure" | "preview";

type BatchWizardProps = {
  onCancel: () => void;
  onSuccess: (createdRows: AdminBulkLayoutCreatedRow[]) => void;
  roomId: string;
  totalSeats: number;
  capacity: number;
};

function rowLettersRange(first: string, last: string): string[] {
  const start = first.toUpperCase().charCodeAt(0);
  const end = last.toUpperCase().charCodeAt(0);
  if (start > end) return [];
  return Array.from({ length: end - start + 1 }, (_, i) =>
    String.fromCharCode(start + i)
  );
}

type RowPreviewEntry = {
  name: string;
  seats: number[];
};

export function AdminBatchSeatWizard({
  capacity,
  onCancel,
  onSuccess,
  roomId,
  totalSeats,
}: BatchWizardProps) {
  const { t } = useI18n();

  const [step, setStep] = useState<Step>("configure");
  const [firstRow, setFirstRow] = useState("A");
  const [lastRow, setLastRow] = useState("E");
  const [seatsPerRow, setSeatsPerRow] = useState("10");
  const [startNumber, setStartNumber] = useState("1");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = rowLettersRange(firstRow, lastRow);
  const seatCount = Number(seatsPerRow);
  const start = Number(startNumber);

  const newSeatCount = rows.length * (Number.isFinite(seatCount) && seatCount > 0 ? seatCount : 0);
  const wouldExceedCapacity = totalSeats + newSeatCount > capacity;

  const preview: RowPreviewEntry[] = rows.map((name) => {
    const seats = Array.from(
      { length: Number.isFinite(seatCount) && seatCount > 0 ? seatCount : 0 },
      (_, i) => start + i
    );
    return { name, seats };
  });

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);

    const payload = {
      room: roomId,
      rows: preview.map(({ name, seats }) => ({
        name,
        seats: seats.map((number) => ({ number })),
      })),
    };

    try {
      const createdRows = await adminApi.bulkCreateLayout(payload);
      onSuccess(createdRows);
    } catch (err) {
      if (err instanceof ApiError) {
        const details = err.details as Record<string, unknown> | null;
        const rowsErr = details?.rows;
        const msg = Array.isArray(rowsErr)
          ? rowsErr[0]
          : typeof rowsErr === "string"
          ? rowsErr
          : null;
        setError(msg ?? t("admin.layout.batchError"));
      } else {
        setError(t("admin.layout.batchError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass = [
    "min-h-[var(--control-height-lg)] w-full rounded-control border bg-surface px-3 py-2",
    "text-sm text-white placeholder:text-white/30 outline-none transition",
    "focus:border-brand focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-[0.68]",
    "border-border",
  ].join(" ");

  if (step === "preview") {
    return (
      <div className="flex flex-col gap-4 rounded-[8px] border border-brand/30 bg-brand/5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-extrabold text-white">
            {t("admin.layout.batchPreview")}
          </span>
          <Button
            disabled={isSubmitting}
            onClick={() => setStep("configure")}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("admin.back")}
          </Button>
        </div>

        {wouldExceedCapacity ? (
          <p className="rounded-[6px] border border-warning/30 bg-warning/5 px-3 py-2 text-xs font-bold text-warning">
            {t("admin.layout.batchCapacityWarning", {
              new: newSeatCount,
              capacity,
              current: totalSeats,
            })}
          </p>
        ) : null}

        <div className="overflow-x-auto rounded-[6px] border border-white/[0.08] bg-white/[0.02]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="px-3 py-2 text-left font-bold text-white/40">
                  {t("admin.layout.rows")}
                </th>
                <th className="px-3 py-2 text-left font-bold text-white/40">
                  {t("admin.layout.batchSeatsPreview")}
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.map(({ name, seats }) => (
                <tr className="border-b border-white/[0.05] last:border-0" key={name}>
                  <td className="px-3 py-2 font-bold text-white">{name}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {seats.map((n) => (
                        <span
                          className="inline-flex h-5 w-5 items-center justify-center rounded-[3px] text-[9px] font-bold border border-white/[0.20] bg-white/[0.05] text-white/50"
                          key={n}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-white/40">
          {t("admin.layout.batchSummary", {
            rows: rows.length,
            seats: newSeatCount,
          })}
        </p>

        {error ? (
          <p className="text-sm font-bold text-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button
            disabled={isSubmitting || rows.length === 0 || newSeatCount === 0 || wouldExceedCapacity}
            isLoading={isSubmitting}
            onClick={handleCreate}
            size="sm"
            type="button"
            variant="primary"
          >
            {t("admin.layout.batchConfirm")}
          </Button>
          <Button
            disabled={isSubmitting}
            onClick={onCancel}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("admin.cancel")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-[8px] border border-brand/30 bg-brand/5 p-4">
      <span className="text-sm font-extrabold text-white">
        {t("admin.layout.batchCreate")}
      </span>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-xs font-bold text-white/60">
            {t("admin.layout.batchFirstRow")}
          </label>
          <input
            className={inputClass}
            maxLength={1}
            onChange={(e) => setFirstRow(e.target.value.toUpperCase())}
            placeholder="A"
            value={firstRow}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-bold text-white/60">
            {t("admin.layout.batchLastRow")}
          </label>
          <input
            className={inputClass}
            maxLength={1}
            onChange={(e) => setLastRow(e.target.value.toUpperCase())}
            placeholder="J"
            value={lastRow}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-bold text-white/60">
            {t("admin.layout.batchSeatsPerRow")}
          </label>
          <input
            className={inputClass}
            min={1}
            onChange={(e) => setSeatsPerRow(e.target.value)}
            placeholder="10"
            type="number"
            value={seatsPerRow}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs font-bold text-white/60">
            {t("admin.layout.batchStartNumber")}
          </label>
          <input
            className={inputClass}
            min={1}
            onChange={(e) => setStartNumber(e.target.value)}
            placeholder="1"
            type="number"
            value={startNumber}
          />
        </div>
      </div>

      {rows.length > 0 && newSeatCount > 0 ? (
        <p className="text-xs text-white/50">
          {t("admin.layout.batchSummary", {
            rows: rows.length,
            seats: newSeatCount,
          })}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button
          disabled={rows.length === 0 || seatCount <= 0}
          onClick={() => setStep("preview")}
          size="sm"
          type="button"
          variant="secondary"
        >
          {t("admin.layout.batchPreviewAction")}
        </Button>
        <Button
          onClick={onCancel}
          size="sm"
          type="button"
          variant="ghost"
        >
          {t("admin.cancel")}
        </Button>
      </div>
    </div>
  );
}
