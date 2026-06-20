"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { adminApi, type AdminBulkLayoutCreatedRow } from "@/api/admin";
import { ApiError } from "@/api/client";
import type { AdminRoom, AdminSeat, AdminSeatRow } from "@/types/catalog";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AdminConfirmDialog, AdminToolbar } from "@/components/admin";
import { AdminBatchSeatWizard } from "@/components/admin/AdminBatchSeatWizard";
import { cn } from "@/components/ui/classNames";
import { useI18n } from "@/i18n";

type LayoutState =
  | { status: "error"; message: string }
  | { status: "loading" }
  | {
      room: AdminRoom;
      rows: AdminSeatRow[];
      seatsByRow: Record<string, AdminSeat[]>;
      status: "ready";
    };

type DeleteTarget =
  | { kind: "row"; row: AdminSeatRow }
  | { kind: "seat"; seat: AdminSeat; rowName: string };

type AdminRoomLayoutEditorProps = {
  roomId: string;
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

function extractConstraintMessage(error: unknown, t: Translate): string | null {
  if (!(error instanceof ApiError)) return null;

  if (error.code === "VALIDATION_FAILED") {
    const details = error.details as Record<string, unknown> | null;

    if (details && typeof details === "object") {
      const roomMsg =
        details.room ??
        details.row ??
        details.name ??
        details.accessible_seat_count ??
        details.non_field_errors ??
        details.detail;

      if (roomMsg) {
        const msgs = Array.isArray(roomMsg) ? roomMsg : [roomMsg];
        const msg = msgs.join(" ");

        if (msg.includes("future sessions")) {
          return t("admin.layout.constraintFutureSessions");
        }

        if (msg.includes("capacity")) {
          return t("admin.layout.constraintCapacity");
        }

        return msg;
      }
    }
  }

  return null;
}

function SeatPreviewCell({
  seat,
  allSeats,
  disabled,
}: {
  seat: AdminSeat;
  allSeats: AdminSeat[];
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const companionOf = allSeats.find((s) => s.companion_seat === seat.id);
  const isCompanion = Boolean(companionOf);
  const pairedCompanion = seat.is_accessible && seat.companion_seat
    ? allSeats.find((s) => s.id === seat.companion_seat)
    : null;

  const accessibleSuffix = seat.is_accessible
    ? t("admin.layout.accessibleSeatSuffix")
    : "";

  return (
    <div
      aria-label={t("admin.layout.seatA11y", {
        accessible: accessibleSuffix,
        number: seat.number,
      })}
      className={cn(
        "relative flex h-7 w-7 items-center justify-center rounded-[4px] text-[10px] font-bold",
        seat.is_accessible
          ? "border-2 border-brand bg-brand/20 text-brand"
          : isCompanion
          ? "border-2 border-brand/50 bg-brand/10 text-brand/70"
          : "border border-white/[0.25] bg-white/[0.06] text-white/60",
        disabled && "opacity-50"
      )}
      title={
        seat.is_accessible
          ? pairedCompanion
            ? t("admin.layout.accessibleWithCompanionTitle", { number: pairedCompanion.number })
            : t("admin.layout.accessibleNoCompanion")
          : isCompanion
          ? t("admin.layout.companionSeatTitle", { number: companionOf!.number })
          : String(seat.number)
      }
    >
      {seat.is_accessible ? "♿" : isCompanion ? "AC" : seat.number}
      {seat.is_accessible && pairedCompanion ? (
        <span
          aria-hidden="true"
          className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-brand text-[6px] text-white"
        >
          🔗
        </span>
      ) : null}
    </div>
  );
}

function SeatCell({
  allSeats,
  isNamoradeira = false,
  rowName,
  seat,
}: {
  allSeats: AdminSeat[];
  isNamoradeira?: boolean;
  rowName: string;
  seat: AdminSeat;
}) {
  const isComp = allSeats.some((s) => s.companion_seat === seat.id);
  return (
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-[3px] text-[9px] font-bold",
        seat.is_accessible
          ? "border border-brand/50 bg-brand/20 text-brand"
          : isComp
          ? "border border-brand/30 bg-brand/10 text-brand/60"
          : isNamoradeira
          ? "border border-dashed border-white/[0.30] bg-white/[0.03] text-white/40"
          : "border border-white/[0.20] bg-white/[0.05] text-white/50"
      )}
      title={`${rowName}${seat.number}${seat.is_accessible ? " ♿" : ""}`}
    >
      {seat.is_accessible ? "♿" : isComp ? "AC" : seat.number}
    </div>
  );
}

function PreviewRow({
  allSeats,
  isAccessible = false,
  isLast = false,
  maxCenterSeatsPerRow = null,
  maxLeftNam = 0,
  maxRightNam = 0,
  row,
  seats,
}: {
  allSeats: AdminSeat[];
  isAccessible?: boolean;
  isLast?: boolean;
  maxCenterSeatsPerRow?: number | null;
  maxLeftNam?: number;
  maxRightNam?: number;
  row: AdminSeatRow;
  seats: AdminSeat[];
}) {
  const { t } = useI18n();

  const labelClass = cn(
    "self-center text-center text-xs font-extrabold",
    isAccessible ? "w-7 text-brand/60" : "w-5 text-white/40"
  );

  // Compute namoradeiras split for non-last, non-accessible rows when limit is set
  const shouldSplit =
    !isLast &&
    !isAccessible &&
    maxCenterSeatsPerRow !== null &&
    seats.length > maxCenterSeatsPerRow;

  let leftNam: AdminSeat[] = [];
  let rightNam: AdminSeat[] = [];
  let centerSeats = seats;

  if (shouldSplit) {
    const excess = seats.length - maxCenterSeatsPerRow;
    const leftExcess = Math.ceil(excess / 2);
    const rightExcess = Math.floor(excess / 2);
    leftNam = seats.slice(0, leftExcess);
    centerSeats = seats.slice(leftExcess, leftExcess + maxCenterSeatsPerRow);
    rightNam = seats.slice(leftExcess + maxCenterSeatsPerRow);
  }

  const leftPad = maxLeftNam - leftNam.length;
  const rightPad = maxRightNam - rightNam.length;
  const hasAnyNam = !isLast && (maxLeftNam > 0 || maxRightNam > 0);

  const halfIndex = Math.ceil(centerSeats.length / 2);
  const leftCenter = centerSeats.slice(0, halfIndex);
  const rightCenter = centerSeats.slice(halfIndex);

  if (seats.length === 0) {
    return (
      <>
        <span aria-hidden="true" className="w-5 self-center text-center text-xs font-extrabold text-white/30">
          {row.name}
        </span>
        <span className="text-xs text-white/20 italic self-center text-center">
          {t("admin.layout.emptyRow")}
        </span>
        <span aria-hidden="true" className="w-5 self-center text-center text-xs font-extrabold text-white/30">
          {row.name}
        </span>
      </>
    );
  }

  return (
    <>
      {/* Col 1: left label */}
      <span aria-hidden="true" className={labelClass}>
        {row.name}
      </span>

      {/* Col 2: all seats — namoradeiras flanking center seats */}
      <div
        aria-label={t("admin.layout.rowA11y", { row: row.name })}
        className="flex items-center justify-center"
        role="group"
      >
        {hasAnyNam && (
          <>
            <div className="flex gap-1">
              {Array.from({ length: leftPad }, (_, i) => (
                <div aria-hidden="true" className="h-6 w-6 flex-shrink-0 opacity-0" key={`lpad-${i}`} />
              ))}
              {leftNam.map((seat) => (
                <SeatCell allSeats={allSeats} isNamoradeira key={seat.id} rowName={row.name} seat={seat} />
              ))}
            </div>
            <div className="w-4 flex-shrink-0" />
          </>
        )}
        <div className="flex gap-1">
          {isLast ? (
            <>
              <div className="flex gap-1 opacity-30">
                {[1, 2, 3].map((n) => (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-[3px] border border-dashed border-white/[0.20] text-[9px] text-white/30"
                    key={`extra-left-${n}`}
                  />
                ))}
              </div>
              <div className="w-1" />
            </>
          ) : null}
          {leftCenter.map((seat) => <SeatCell allSeats={allSeats} key={seat.id} rowName={row.name} seat={seat} />)}
        </div>
        <div className="w-5 flex-shrink-0" />
        <div className="flex gap-1">
          {rightCenter.map((seat) => <SeatCell allSeats={allSeats} key={seat.id} rowName={row.name} seat={seat} />)}
          {isLast ? (
            <>
              <div className="w-1" />
              <div className="flex gap-1 opacity-30">
                {[1, 2, 3].map((n) => (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-[3px] border border-dashed border-white/[0.20] text-[9px] text-white/30"
                    key={`extra-right-${n}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
        {hasAnyNam && (
          <>
            <div className="w-4 flex-shrink-0" />
            <div className="flex gap-1">
              {rightNam.map((seat) => (
                <SeatCell allSeats={allSeats} isNamoradeira key={seat.id} rowName={row.name} seat={seat} />
              ))}
              {Array.from({ length: rightPad }, (_, i) => (
                <div aria-hidden="true" className="h-6 w-6 flex-shrink-0 opacity-0" key={`rpad-${i}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Col 3: right label */}
      <span aria-hidden="true" className={labelClass}>
        {row.name}
      </span>
    </>
  );
}

function SeatMapPreview({
  maxCenterSeatsPerRow = null,
  rows,
  seatsByRow,
}: {
  maxCenterSeatsPerRow?: number | null;
  rows: AdminSeatRow[];
  seatsByRow: Record<string, AdminSeat[]>;
}) {
  const { t } = useI18n();
  const allSeats = rows.flatMap((r) => seatsByRow[r.id] ?? []);

  if (allSeats.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-white/40">
        {t("admin.layout.noPreviewSeats")}
      </p>
    );
  }

  const lastRow = rows[rows.length - 1];

  const namCounts = rows
    .filter((r) => !r.is_accessible_row && r.id !== lastRow?.id && maxCenterSeatsPerRow !== null)
    .map((r) => {
      const s = [...(seatsByRow[r.id] ?? [])].sort((a, b) => a.number - b.number);
      if (s.length <= maxCenterSeatsPerRow!) return { left: 0, right: 0 };
      const excess = s.length - maxCenterSeatsPerRow!;
      return { left: Math.ceil(excess / 2), right: Math.floor(excess / 2) };
    });

  const maxLeftNam = Math.max(0, ...namCounts.map((c) => c.left));
  const maxRightNam = Math.max(0, ...namCounts.map((c) => c.right));

  return (
    <div
      aria-label={t("admin.layout.mapPreviewA11y")}
      className="overflow-x-auto"
      role="img"
    >
      <div
        className="inline-grid min-w-max gap-x-3 gap-y-2 pb-4"
        style={{ gridTemplateColumns: "auto auto auto" }}
      >
        <div className="col-span-3 flex justify-center pb-1">
          <div className="flex h-6 w-3/4 max-w-xs items-center justify-center rounded-b-full bg-brand/30 text-[10px] font-extrabold uppercase tracking-widest text-brand/80">
            {t("admin.layout.screen")}
          </div>
        </div>

        {rows.map((row) => (
          <PreviewRow
            allSeats={allSeats}
            isAccessible={row.is_accessible_row}
            isLast={lastRow?.id === row.id}
            key={row.id}
            maxCenterSeatsPerRow={maxCenterSeatsPerRow}
            maxLeftNam={maxLeftNam}
            maxRightNam={maxRightNam}
            row={row}
            seats={[...(seatsByRow[row.id] ?? [])].sort((a, b) => a.number - b.number)}
          />
        ))}

        <div className="col-span-3 mt-1 text-center text-[10px] font-bold uppercase tracking-widest text-white/20">
          {t("admin.layout.backOfRoom")}
        </div>

        <div className="col-span-3 mt-2 flex flex-wrap justify-center gap-4 text-[10px] text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-[2px] border border-white/[0.20] bg-white/[0.05]" />
            {t("admin.layout.available")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-[2px] border border-brand/50 bg-brand/20 text-[8px] text-brand">
              ♿
            </span>
            {t("admin.layout.accessible")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-[2px] border border-brand/30 bg-brand/10 text-[8px] text-brand/60">
              AC
            </span>
            {t("admin.layout.companionSeat")}
          </span>
        </div>
      </div>
    </div>
  );
}

function RowEditor({
  row,
  seats,
  allSeats,
  totalSeats,
  capacity,
  onSeatAdded,
  onSeatDelete,
}: {
  row: AdminSeatRow;
  seats: AdminSeat[];
  allSeats: AdminSeat[];
  totalSeats: number;
  capacity: number;
  onSeatAdded: (seat: AdminSeat) => void;
  onSeatDelete: (seat: AdminSeat) => void;
}) {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [addCount, setAddCount] = useState("1");
  const [addError, setAddError] = useState<string | null>(null);

  const sortedSeats = [...seats].sort((a, b) => a.number - b.number);
  const nextNumber = sortedSeats.length > 0
    ? sortedSeats[sortedSeats.length - 1].number + 1
    : 1;
  const isAtCapacity = totalSeats >= capacity;

  async function handleAddSeats() {
    const count = Math.max(1, Number(addCount) || 1);
    if (isAtCapacity) return;

    const availableSlots = capacity - totalSeats;
    const toCreate = Math.min(count, availableSlots);

    setIsAdding(true);
    setAddError(null);
    try {
      for (let i = 0; i < toCreate; i++) {
        const created = await adminApi.createSeat({
          is_accessible: false,
          number: nextNumber + i,
          row: row.id,
        });
        onSeatAdded(created);
      }
    } catch (err) {
      const constraintMsg = extractConstraintMessage(err, t);
      setAddError(
        constraintMsg ?? t("admin.layout.addSeatError")
      );
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {sortedSeats.map((seat) => (
          <div
            className="flex items-center gap-1 rounded-[6px] border border-white/[0.08] bg-white/[0.03] px-2 py-1"
            key={seat.id}
          >
            <SeatPreviewCell
              allSeats={allSeats}
              seat={seat}
            />
            <button
              aria-label={t("admin.layout.removeSeatA11y", { number: seat.number })}
              className="ml-0.5 flex h-5 w-5 items-center justify-center rounded text-white/30 transition hover:text-error"
              disabled={isAdding}
              onClick={() => onSeatDelete(seat)}
              type="button"
            >
              ×
            </button>
          </div>
        ))}

        {isAtCapacity ? (
          <div className="flex items-center rounded-[6px] border border-warning/30 bg-warning/5 px-3 py-1 text-xs font-bold text-warning">
            {t("admin.layout.capacityMax")}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <input
              className="w-14 min-h-[2rem] rounded-[6px] border border-white/[0.15] bg-white/[0.03] px-2 py-1 text-center text-sm text-white outline-none focus:border-brand"
              disabled={isAdding}
              min={1}
              onChange={(e) => setAddCount(e.target.value)}
              title={t("admin.layout.addSeatCountLabel")}
              type="number"
              value={addCount}
            />
            <button
              className={[
                "flex h-8 items-center gap-1 rounded-[6px] border border-dashed px-2 text-sm transition",
                "border-white/[0.15] text-white/30 hover:border-brand/50 hover:text-brand",
                isAdding ? "cursor-wait opacity-50" : "",
              ].join(" ")}
              disabled={isAdding}
              onClick={handleAddSeats}
              title={t("admin.layout.addSeatsTitle", { count: Number(addCount) || 1, from: nextNumber })}
              type="button"
            >
              + {t("admin.layout.addSeatsBtn")}
            </button>
          </div>
        )}
      </div>

      {addError ? (
        <p className="text-xs font-bold text-error" role="alert">
          {addError}
        </p>
      ) : null}
    </div>
  );
}

function PriorityRowForm({
  roomId,
  totalSeats,
  capacity,
  hasAccessibleRow,
  onCancel,
  onSuccess,
}: {
  roomId: string;
  totalSeats: number;
  capacity: number;
  hasAccessibleRow: boolean;
  onCancel: () => void;
  onSuccess: (createdRow: AdminBulkLayoutCreatedRow) => void;
}) {
  const { t } = useI18n();
  const [rowName, setRowName] = useState("PCD");
  const [accessibleCount, setAccessibleCount] = useState("4");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const count = Number(accessibleCount) || 0;
  const totalNew = count * 2;
  const wouldExceedCapacity = totalSeats + totalNew > capacity;

  async function handleCreate() {
    if (!rowName.trim() || count <= 0) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await adminApi.createAccessibleRow({
        accessible_seat_count: count,
        name: rowName.trim(),
        room: roomId,
      });
      onSuccess(created);
    } catch (err) {
      const constraintMsg = extractConstraintMessage(err, t);
      setError(constraintMsg ?? t("admin.layout.priorityRowError"));
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

  return (
    <div className="flex flex-col gap-3 rounded-[8px] border border-brand/30 bg-brand/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-extrabold text-white">
          {t("admin.layout.priorityRowTitle")}
        </span>
        {hasAccessibleRow ? (
          <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
            {t("admin.layout.priorityRowAlreadyExists")}
          </span>
        ) : null}
      </div>

      <p className="text-xs text-white/50">
        {t("admin.layout.priorityRowHelp")}
      </p>

      {hasAccessibleRow ? (
        <p className="rounded-[6px] border border-warning/30 bg-warning/5 px-3 py-2 text-xs font-bold text-warning">
          {t("admin.layout.priorityRowBlockedMessage")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label className="text-xs font-bold text-white/60">
              {t("admin.layout.priorityRowName")}
            </label>
            <input
              className={inputClass}
              disabled={isSubmitting}
              maxLength={2}
              onChange={(e) => setRowName(e.target.value.toUpperCase())}
              placeholder="PCD"
              ref={inputRef}
              value={rowName}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-xs font-bold text-white/60">
              {t("admin.layout.priorityRowCount")}
            </label>
            <input
              className={inputClass}
              disabled={isSubmitting}
              min={1}
              onChange={(e) => setAccessibleCount(e.target.value)}
              placeholder="4"
              type="number"
              value={accessibleCount}
            />
          </div>
        </div>
      )}

      {count > 0 && !hasAccessibleRow ? (
        <p className="text-xs text-white/50">
          {t("admin.layout.priorityRowSummary", {
            accessible: count,
            total: totalNew,
          })}
          {wouldExceedCapacity ? (
            <span className="ml-1 font-bold text-warning">
              {t("admin.layout.priorityRowCapacityWarning", {
                current: totalSeats,
                capacity,
              })}
            </span>
          ) : null}
        </p>
      ) : null}

      {error ? (
        <p className="text-sm font-bold text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        {!hasAccessibleRow ? (
          <Button
            disabled={isSubmitting || !rowName.trim() || count <= 0 || wouldExceedCapacity}
            isLoading={isSubmitting}
            onClick={handleCreate}
            size="sm"
            type="button"
            variant="primary"
          >
            {t("admin.create")}
          </Button>
        ) : null}
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

function orderRows(rows: AdminSeatRow[], accessibleRowIndex: number): AdminSeatRow[] {
  const regularRows = rows
    .filter((r) => !r.is_accessible_row)
    .sort((a, b) => a.name.localeCompare(b.name));
  const accessibleRow = rows.find((r) => r.is_accessible_row);

  if (!accessibleRow) return regularRows;

  const idx = Math.min(accessibleRowIndex, regularRows.length);
  return [...regularRows.slice(0, idx), accessibleRow, ...regularRows.slice(idx)];
}

export function AdminRoomLayoutEditor({ roomId }: AdminRoomLayoutEditorProps) {
  const { t } = useI18n();
  const [state, setState] = useState<LayoutState>({ status: "loading" });
  const [showPreview, setShowPreview] = useState(false);
  const [showBatchWizard, setShowBatchWizard] = useState(false);
  const [showPriorityRow, setShowPriorityRow] = useState(false);

  const [newRowName, setNewRowName] = useState("");
  const [newRowSeatCount, setNewRowSeatCount] = useState("0");
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [showCreateRow, setShowCreateRow] = useState(false);
  const [createRowError, setCreateRowError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);

  const createRowInputRef = useRef<HTMLInputElement>(null);

  const loadLayout = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const [room, rows, allSeats] = await Promise.all([
        adminApi.getRoom(roomId),
        adminApi.listAllSeatRows(roomId),
        adminApi.listAllSeats(roomId),
      ]);

      const sortedRows = orderRows(rows, room.accessible_row_index ?? 0);

      const rowIds = new Set(sortedRows.map((r) => r.id));
      const seatsByRow: Record<string, AdminSeat[]> = {};
      for (const seat of allSeats) {
        if (rowIds.has(seat.row)) {
          (seatsByRow[seat.row] ??= []).push(seat);
        }
      }

      setState({ room, rows: sortedRows, seatsByRow, status: "ready" });
    } catch {
      setState({
        message: t("admin.layout.loadError"),
        status: "error",
      });
    }
  }, [roomId, t]);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  useEffect(() => {
    if (showCreateRow) {
      createRowInputRef.current?.focus();
    }
  }, [showCreateRow]);

  async function handleCreateRow() {
    const name = newRowName.trim().toUpperCase();
    if (!name) return;

    const seatCount = Math.max(0, Number(newRowSeatCount) || 0);

    setIsCreatingRow(true);
    setCreateRowError(null);
    try {
      if (seatCount > 0) {
        const payload = {
          room: roomId,
          rows: [
            {
              name,
              seats: Array.from({ length: seatCount }, (_, i) => ({ number: i + 1 })),
            },
          ],
        };
        const [createdRow] = await adminApi.bulkCreateLayout(payload);
        setState((prev) => {
          if (prev.status !== "ready") return prev;
          const { seats, ...row } = createdRow;
          const newRows = orderRows(
            [...prev.rows, row],
            prev.room.accessible_row_index ?? 0
          );
          return {
            ...prev,
            rows: newRows,
            seatsByRow: { ...prev.seatsByRow, [row.id]: seats },
          };
        });
      } else {
        const created = await adminApi.createSeatRow({ name, room: roomId });
        setState((prev) => {
          if (prev.status !== "ready") return prev;
          const newRows = orderRows(
            [...prev.rows, created],
            prev.room.accessible_row_index ?? 0
          );
          return {
            ...prev,
            rows: newRows,
            seatsByRow: { ...prev.seatsByRow, [created.id]: [] },
          };
        });
      }
      setNewRowName("");
      setNewRowSeatCount("0");
      setShowCreateRow(false);
    } catch (err) {
      const constraintMsg = extractConstraintMessage(err, t);
      if (constraintMsg) {
        setCreateRowError(constraintMsg);
      } else if (err instanceof ApiError && err.code === "VALIDATION_FAILED") {
        const details = err.details as Record<string, unknown> | null;
        const nameErr = details?.name ?? (details?.rows as string[] | undefined)?.[0];
        setCreateRowError(
          Array.isArray(nameErr)
            ? nameErr[0]
            : String(nameErr ?? t("admin.layout.invalidRowName"))
        );
      } else {
        setCreateRowError(t("admin.layout.createRowError"));
      }
    } finally {
      setIsCreatingRow(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (deleteTarget.kind === "row") {
        await adminApi.deleteSeatRow(deleteTarget.row.id);
        const removedRowId = deleteTarget.row.id;
        setState((prev) => {
          if (prev.status !== "ready") return prev;
          const restSeats = Object.fromEntries(
            Object.entries(prev.seatsByRow).filter(([k]) => k !== removedRowId)
          );
          return {
            ...prev,
            rows: prev.rows.filter((r) => r.id !== removedRowId),
            seatsByRow: restSeats,
          };
        });
      } else {
        await adminApi.deleteSeat(deleteTarget.seat.id);
        setState((prev) => {
          if (prev.status !== "ready") return prev;
          const rowId = deleteTarget.seat.row;
          return {
            ...prev,
            seatsByRow: {
              ...prev.seatsByRow,
              [rowId]: (prev.seatsByRow[rowId] ?? []).filter(
                (s) => s.id !== deleteTarget.seat.id
              ),
            },
          };
        });
      }
      setDeleteTarget(null);
    } catch (err) {
      const constraintMsg = extractConstraintMessage(err, t);
      setDeleteError(
        constraintMsg ?? t("admin.layout.deleteError")
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleSeatAdded(rowId: string, seat: AdminSeat) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        seatsByRow: {
          ...prev.seatsByRow,
          [rowId]: [...(prev.seatsByRow[rowId] ?? []), seat],
        },
      };
    });
  }

  function applyCreatedRows(createdRows: AdminBulkLayoutCreatedRow[]) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;

      const newSeatsByRow: Record<string, AdminSeat[]> = { ...prev.seatsByRow };
      const newRowEntries: AdminSeatRow[] = [];

      for (const { seats, ...row } of createdRows) {
        newSeatsByRow[row.id] = seats;
        newRowEntries.push(row);
      }

      const merged = orderRows(
        [...prev.rows, ...newRowEntries],
        prev.room.accessible_row_index ?? 0
      );

      return { ...prev, rows: merged, seatsByRow: newSeatsByRow };
    });
  }

  async function handleMoveAccessibleRow(direction: "up" | "down") {
    if (state.status !== "ready") return;

    const { room, rows } = state;
    const currentIdx = rows.findIndex((r) => r.is_accessible_row);
    if (currentIdx === -1) return;

    const newIdx =
      direction === "up"
        ? Math.max(0, currentIdx - 1)
        : Math.min(rows.length - 1, currentIdx + 1);

    if (newIdx === currentIdx) return;

    const newRows = [...rows];
    const [accRow] = newRows.splice(currentIdx, 1);
    newRows.splice(newIdx, 0, accRow);

    setState((prev) =>
      prev.status === "ready" ? { ...prev, rows: newRows } : prev
    );
    setMoveError(null);

    try {
      await adminApi.updateRoom(room.id, { accessible_row_index: newIdx });
      setState((prev) =>
        prev.status === "ready"
          ? { ...prev, room: { ...prev.room, accessible_row_index: newIdx } }
          : prev
      );
    } catch {
      setState((prev) =>
        prev.status === "ready" ? { ...prev, rows } : prev
      );
      setMoveError(t("admin.layout.moveRowError"));
    }
  }

  function applyCreatedAccessibleRow(createdRow: AdminBulkLayoutCreatedRow) {
    applyCreatedRows([createdRow]);
    setShowPriorityRow(false);
  }

  if (state.status === "loading") {
    return (
      <div className="grid gap-6">
        <div className="h-8 w-48 animate-pulse rounded bg-white/[0.06]" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              className="h-24 animate-pulse rounded-[8px] bg-white/[0.04]"
              key={i}
            />
          ))}
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="grid gap-4">
        <p className="text-sm font-bold text-error" role="alert">
          {state.message}
        </p>
        <div>
          <Button onClick={() => loadLayout()} variant="secondary">
            {t("common.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  const { room, rows, seatsByRow } = state;
  const allSeats = rows.flatMap((r) => seatsByRow[r.id] ?? []);
  const totalSeats = allSeats.length;
  const capacityUsed = Math.round((totalSeats / room.capacity) * 100);
  const isNearCapacity = totalSeats >= room.capacity;
  const hasAccessibleRow = rows.some((r) => r.is_accessible_row);

  const deleteDialogProps = deleteTarget
    ? deleteTarget.kind === "row"
      ? {
          description: t("admin.layout.deleteRowDescription", {
            row: deleteTarget.row.name,
          }),
          title: t("admin.layout.deleteRowTitle", { row: deleteTarget.row.name }),
        }
      : {
          description: t("admin.layout.deleteSeatDescription", {
            seat: `${deleteTarget.rowName}${deleteTarget.seat.number}`,
          }),
          title: t("admin.layout.deleteSeatTitle"),
        }
    : { description: "", title: "" };

  return (
    <div className="grid gap-6">
      <AdminToolbar
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPreview((v) => !v)}
              size="sm"
              variant="secondary"
            >
              {showPreview
                ? t("admin.layout.hidePreview")
                : t("admin.layout.mapPreview")}
            </Button>
            <ButtonLink
              href={`/admin/rooms/${room.id}/edit`}
              size="sm"
              variant="ghost"
            >
              {t("admin.room.edit")}
            </ButtonLink>
          </div>
        }
        title={t("admin.layout.roomTitle", {
          room: room.display_name || room.name,
        })}
      />

      {/* Room info bar */}
      <div className="flex flex-wrap gap-4 rounded-[8px] border border-white/[0.07] bg-white/[0.02] p-4 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white/40">
            {t("admin.session.room")}
          </span>
          <span className="font-bold text-white">{room.name}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white/40">
            {t("admin.room.capacity")}
          </span>
          <span
            className={cn(
              "font-bold",
              isNearCapacity ? "text-warning" : "text-white"
            )}
          >
            {t("admin.layout.capacitySummary", {
              capacity: room.capacity,
              used: totalSeats,
            })}
            {capacityUsed > 0
              ? ` (${isNearCapacity ? t("admin.layout.capacityFull") : `${capacityUsed}%`})`
              : ""}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white/40">
            {t("admin.layout.rows")}
          </span>
          <span className="font-bold text-white">{rows.length}</span>
        </div>
        {room.max_center_seats_per_row ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40">
              {t("admin.room.maxCenterSeats")}
            </span>
            <span className="font-bold text-white">{room.max_center_seats_per_row}</span>
          </div>
        ) : null}
      </div>

      {/* Seat map preview */}
      {showPreview ? (
        <div className="rounded-[8px] border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
            {t("admin.layout.mapPreviewA11y")}
          </p>
          <SeatMapPreview maxCenterSeatsPerRow={room.max_center_seats_per_row ?? null} rows={rows} seatsByRow={seatsByRow} />
        </div>
      ) : null}

      {/* Seat rows */}
      <div className="grid gap-4">
        {deleteError ? (
          <p className="text-sm font-bold text-error" role="alert">
            {deleteError}
          </p>
        ) : null}
        {moveError ? (
          <p className="text-sm font-bold text-error" role="alert">
            {moveError}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-white/60">
            {t("admin.layout.rows")}
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowPriorityRow(true);
                setShowBatchWizard(false);
                setShowCreateRow(false);
              }}
              size="sm"
              variant="secondary"
            >
              {t("admin.layout.priorityRowBtn")}
            </Button>
            <Button
              onClick={() => {
                setShowBatchWizard(true);
                setShowCreateRow(false);
                setShowPriorityRow(false);
              }}
              size="sm"
              variant="secondary"
            >
              {t("admin.layout.batchCreate")}
            </Button>
            <Button
              onClick={() => {
                setShowCreateRow(true);
                setShowBatchWizard(false);
                setShowPriorityRow(false);
                setNewRowName("");
                setNewRowSeatCount("0");
                setCreateRowError(null);
              }}
              size="sm"
              variant="secondary"
            >
              {t("admin.layout.addRow")}
            </Button>
          </div>
        </div>

        {showPriorityRow ? (
          <PriorityRowForm
            capacity={room.capacity}
            hasAccessibleRow={hasAccessibleRow}
            onCancel={() => setShowPriorityRow(false)}
            onSuccess={applyCreatedAccessibleRow}
            roomId={roomId}
            totalSeats={totalSeats}
          />
        ) : null}

        {showBatchWizard ? (
          <AdminBatchSeatWizard
            capacity={room.capacity}
            onCancel={() => setShowBatchWizard(false)}
            onSuccess={(createdRows) => {
              setShowBatchWizard(false);
              applyCreatedRows(createdRows);
            }}
            roomId={roomId}
            totalSeats={totalSeats}
          />
        ) : null}

        {showCreateRow ? (
          <div className="flex flex-col gap-3 rounded-[8px] border border-brand/30 bg-brand/5 p-4">
            <span className="text-sm font-extrabold text-white">
              {t("admin.layout.newRow")}
            </span>
            <p className="text-xs text-white/50">
              {t("admin.layout.rowHelp")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-white/60">
                  {t("admin.layout.rowNameLabel")}
                </label>
                <input
                  className={[
                    "min-h-[var(--control-height-lg)] w-full rounded-control border bg-surface px-3 py-2",
                    "text-sm text-white uppercase placeholder:text-white/30 outline-none transition",
                    "focus:border-brand focus:shadow-focus",
                    createRowError ? "border-error" : "border-border",
                  ].join(" ")}
                  disabled={isCreatingRow}
                  maxLength={2}
                  onChange={(e) => setNewRowName(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateRow();
                    if (e.key === "Escape") {
                      setShowCreateRow(false);
                      setNewRowName("");
                      setCreateRowError(null);
                    }
                  }}
                  placeholder={t("admin.layout.rowPlaceholder")}
                  ref={createRowInputRef}
                  value={newRowName}
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-white/60">
                  {t("admin.layout.rowSeatCountLabel")}
                </label>
                <input
                  className={[
                    "min-h-[var(--control-height-lg)] w-full rounded-control border bg-surface px-3 py-2",
                    "text-sm text-white placeholder:text-white/30 outline-none transition",
                    "focus:border-brand focus:shadow-focus border-border",
                  ].join(" ")}
                  disabled={isCreatingRow}
                  min={0}
                  onChange={(e) => setNewRowSeatCount(e.target.value)}
                  placeholder="0"
                  type="number"
                  value={newRowSeatCount}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={isCreatingRow || !newRowName.trim()}
                isLoading={isCreatingRow}
                onClick={handleCreateRow}
                size="sm"
                type="button"
                variant="primary"
              >
                {t("admin.create")}
              </Button>
              <Button
                disabled={isCreatingRow}
                onClick={() => {
                  setShowCreateRow(false);
                  setNewRowName("");
                  setNewRowSeatCount("0");
                  setCreateRowError(null);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                {t("admin.cancel")}
              </Button>
            </div>
            {createRowError ? (
              <p className="text-sm font-bold text-error" role="alert">
                {createRowError}
              </p>
            ) : null}
          </div>
        ) : null}

        {rows.length === 0 && !showCreateRow && !showBatchWizard && !showPriorityRow ? (
          <div className="flex flex-col items-center gap-2 rounded-[8px] border border-dashed border-white/[0.10] py-10 text-center">
            <p className="text-sm font-bold text-white/50">
              {t("admin.layout.noRowsTitle")}
            </p>
            <p className="text-xs text-white/30">
              {t("admin.layout.noRowsDescription")}
            </p>
          </div>
        ) : null}

        {rows.map((row, rowIndex) => {
          const seats = seatsByRow[row.id] ?? [];
          return (
            <div
              className="rounded-[8px] border border-white/[0.07] bg-white/[0.02] p-4"
              key={row.id}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "flex h-7 min-w-[1.75rem] items-center justify-center rounded-[5px] px-1 text-sm font-extrabold text-white",
                    row.is_accessible_row ? "bg-brand/30" : "bg-white/[0.08]"
                  )}>
                    {row.name}
                  </span>
                  <span className="text-xs text-white/40">
                    {t("admin.layout.seatCount", {
                      count: seats.length,
                      seatWord:
                        seats.length === 1
                          ? t("admin.layout.seatSingular")
                          : t("admin.layout.seatPlural"),
                    })}
                  </span>
                  {row.is_accessible_row ? (
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand/70">
                      {t("admin.layout.rowAHint")}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {row.is_accessible_row ? (
                    <div className="flex gap-1">
                      <button
                        aria-label={t("admin.layout.moveRowUp")}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-[5px] border text-sm transition",
                          rowIndex === 0
                            ? "border-white/[0.08] text-white/20 cursor-not-allowed"
                            : "border-white/[0.15] text-white/50 hover:border-brand/50 hover:text-brand"
                        )}
                        disabled={rowIndex === 0}
                        onClick={() => handleMoveAccessibleRow("up")}
                        title={t("admin.layout.moveRowUp")}
                        type="button"
                      >
                        ↑
                      </button>
                      <button
                        aria-label={t("admin.layout.moveRowDown")}
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-[5px] border text-sm transition",
                          rowIndex === rows.length - 1
                            ? "border-white/[0.08] text-white/20 cursor-not-allowed"
                            : "border-white/[0.15] text-white/50 hover:border-brand/50 hover:text-brand"
                        )}
                        disabled={rowIndex === rows.length - 1}
                        onClick={() => handleMoveAccessibleRow("down")}
                        title={t("admin.layout.moveRowDown")}
                        type="button"
                      >
                        ↓
                      </button>
                    </div>
                  ) : null}
                  <Button
                    onClick={() => setDeleteTarget({ kind: "row", row })}
                    size="sm"
                    variant="danger"
                  >
                    {t("admin.layout.deleteRow")}
                  </Button>
                </div>
              </div>

              {!row.is_accessible_row && (
                <RowEditor
                  allSeats={allSeats}
                  capacity={room.capacity}
                  onSeatAdded={(seat) => handleSeatAdded(row.id, seat)}
                  onSeatDelete={(seat) =>
                    setDeleteTarget({ kind: "seat", rowName: row.name, seat })
                  }
                  row={row}
                  seats={seats}
                  totalSeats={totalSeats}
                />
              )}
            </div>
          );
        })}
      </div>

      <AdminConfirmDialog
        confirmLabel={isDeleting ? t("admin.deleting") : t("admin.delete")}
        description={deleteDialogProps.description}
        isOpen={deleteTarget !== null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteDialogProps.title}
        tone="danger"
      />
    </div>
  );
}
