"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { adminApi } from "@/api/admin";
import { ApiError } from "@/api/client";
import type { AdminRoom, AdminSeat, AdminSeatRow } from "@/types/catalog";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AdminConfirmDialog, AdminToolbar } from "@/components/admin";
import { cn } from "@/components/ui/classNames";

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

function extractConstraintMessage(error: unknown): string | null {
  if (!(error instanceof ApiError)) return null;

  if (error.code === "VALIDATION_FAILED") {
    const details = error.details as Record<string, unknown> | null;

    if (details && typeof details === "object") {
      const roomMsg =
        details.room ??
        details.row ??
        details.non_field_errors ??
        details.detail;

      if (roomMsg) {
        const msgs = Array.isArray(roomMsg) ? roomMsg : [roomMsg];
        const msg = msgs.join(" ");

        if (msg.includes("future sessions")) {
          return "Não é possível alterar o layout desta sala enquanto houver sessões futuras agendadas.";
        }

        if (msg.includes("capacity")) {
          return "Capacidade da sala atingida. Aumente a capacidade antes de adicionar mais assentos.";
        }

        return msg;
      }
    }
  }

  return null;
}

function SeatPreviewCell({
  seat,
  onClick,
}: {
  seat: AdminSeat;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={`Assento ${seat.number}${seat.is_accessible ? ", acessível" : ""}`}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-[4px] text-[10px] font-bold transition",
        seat.is_accessible
          ? "border-2 border-brand bg-brand/20 text-brand"
          : "border border-white/[0.25] bg-white/[0.06] text-white/60 hover:border-white/50 hover:text-white"
      )}
      onClick={onClick}
      title={seat.is_accessible ? "Acessível — clique para alternar" : "Clique para marcar como acessível"}
      type="button"
    >
      {seat.is_accessible ? "♿" : seat.number}
    </button>
  );
}

function SeatMapPreview({
  rows,
  seatsByRow,
}: {
  rows: AdminSeatRow[];
  seatsByRow: Record<string, AdminSeat[]>;
}) {
  const allSeats = rows.flatMap((r) => seatsByRow[r.id] ?? []);

  if (allSeats.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-white/40">
        Nenhum assento cadastrado para prévia.
      </p>
    );
  }

  return (
    <div
      aria-label="Prévia do mapa de assentos"
      className="overflow-x-auto"
      role="img"
    >
      <div className="inline-flex min-w-full flex-col items-center gap-2 pb-4">
        <div className="flex h-6 w-3/4 max-w-xs items-center justify-center rounded-b-full bg-brand/30 text-[10px] font-extrabold uppercase tracking-widest text-brand/80">
          TELA
        </div>

        {rows.map((row) => {
          const seats = [...(seatsByRow[row.id] ?? [])].sort(
            (a, b) => a.number - b.number
          );

          if (seats.length === 0) {
            return (
              <div className="flex items-center gap-2" key={row.id}>
                <span className="w-5 text-center text-xs font-extrabold text-white/30">
                  {row.name}
                </span>
                <span className="text-xs text-white/20 italic">vazia</span>
              </div>
            );
          }

          const halfIndex = Math.ceil(seats.length / 2);
          const leftSeats = seats.slice(0, halfIndex);
          const rightSeats = seats.slice(halfIndex);

          return (
            <div
              aria-label={`Fileira ${row.name}`}
              className="flex items-center gap-2"
              key={row.id}
              role="group"
            >
              <span
                aria-hidden="true"
                className="w-5 text-center text-xs font-extrabold text-white/40"
              >
                {row.name}
              </span>
              <div className="flex gap-1">
                {leftSeats.map((seat) => (
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-[3px] text-[9px] font-bold",
                      seat.is_accessible
                        ? "border border-brand/50 bg-brand/20 text-brand"
                        : "border border-white/[0.20] bg-white/[0.05] text-white/50"
                    )}
                    key={seat.id}
                    title={`${row.name}${seat.number}${seat.is_accessible ? " ♿" : ""}`}
                  >
                    {seat.is_accessible ? "♿" : seat.number}
                  </div>
                ))}
              </div>
              <div className="w-3" />
              <div className="flex gap-1">
                {rightSeats.map((seat) => (
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-[3px] text-[9px] font-bold",
                      seat.is_accessible
                        ? "border border-brand/50 bg-brand/20 text-brand"
                        : "border border-white/[0.20] bg-white/[0.05] text-white/50"
                    )}
                    key={seat.id}
                    title={`${row.name}${seat.number}${seat.is_accessible ? " ♿" : ""}`}
                  >
                    {seat.is_accessible ? "♿" : seat.number}
                  </div>
                ))}
              </div>
              <span
                aria-hidden="true"
                className="w-5 text-center text-xs font-extrabold text-white/40"
              >
                {row.name}
              </span>
            </div>
          );
        })}

        <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/20">
          Fundo da sala
        </div>

        <div className="mt-2 flex flex-wrap justify-center gap-4 text-[10px] text-white/50">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-[2px] border border-white/[0.20] bg-white/[0.05]" />
            Disponível
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3.5 w-3.5 rounded-[2px] border border-brand/50 bg-brand/20 text-[8px] text-brand">
              ♿
            </span>
            Acessível
          </span>
        </div>
      </div>
    </div>
  );
}

function RowEditor({
  row,
  seats,
  totalSeats,
  capacity,
  onSeatAdded,
  onSeatUpdated,
  onSeatDelete,
}: {
  row: AdminSeatRow;
  seats: AdminSeat[];
  totalSeats: number;
  capacity: number;
  onSeatAdded: (seat: AdminSeat) => void;
  onSeatUpdated: (seat: AdminSeat) => void;
  onSeatDelete: (seat: AdminSeat) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const sortedSeats = [...seats].sort((a, b) => a.number - b.number);
  const nextNumber = sortedSeats.length > 0
    ? sortedSeats[sortedSeats.length - 1].number + 1
    : 1;
  const isAtCapacity = totalSeats >= capacity;

  async function handleAddSeat() {
    if (isAtCapacity) return;

    setIsAdding(true);
    setAddError(null);
    try {
      const created = await adminApi.createSeat({
        is_accessible: false,
        number: nextNumber,
        row: row.id,
      });
      onSeatAdded(created);
    } catch (err) {
      const constraintMsg = extractConstraintMessage(err);
      setAddError(
        constraintMsg ?? "Não foi possível adicionar o assento. Tente novamente."
      );
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggleAccessible(seat: AdminSeat) {
    setTogglingId(seat.id);
    try {
      const updated = await adminApi.updateSeat(seat.id, {
        is_accessible: !seat.is_accessible,
      });
      onSeatUpdated(updated);
    } catch {
      // silently ignore — the UI will revert since we don't optimistically update
    } finally {
      setTogglingId(null);
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
              onClick={() => handleToggleAccessible(seat)}
              seat={togglingId === seat.id ? { ...seat } : seat}
            />
            <button
              aria-label={`Remover assento ${seat.number}`}
              className="ml-0.5 flex h-5 w-5 items-center justify-center rounded text-white/30 transition hover:text-error"
              disabled={togglingId === seat.id}
              onClick={() => onSeatDelete(seat)}
              type="button"
            >
              ×
            </button>
          </div>
        ))}

        {isAtCapacity ? (
          <div className="flex items-center rounded-[6px] border border-warning/30 bg-warning/5 px-3 py-1 text-xs font-bold text-warning">
            Capacidade máxima atingida
          </div>
        ) : (
          <button
            className={[
              "flex h-9 w-9 items-center justify-center rounded-[6px] border border-dashed text-lg transition",
              "border-white/[0.15] text-white/30 hover:border-brand/50 hover:text-brand",
              isAdding ? "cursor-wait opacity-50" : "",
            ].join(" ")}
            disabled={isAdding}
            onClick={handleAddSeat}
            title={`Adicionar assento ${nextNumber}`}
            type="button"
          >
            +
          </button>
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

export function AdminRoomLayoutEditor({ roomId }: AdminRoomLayoutEditorProps) {
  const [state, setState] = useState<LayoutState>({ status: "loading" });
  const [showPreview, setShowPreview] = useState(false);

  const [newRowName, setNewRowName] = useState("");
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [showCreateRow, setShowCreateRow] = useState(false);
  const [createRowError, setCreateRowError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const createRowInputRef = useRef<HTMLInputElement>(null);

  const loadLayout = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const [room, rows] = await Promise.all([
        adminApi.getRoom(roomId),
        adminApi.listAllSeatRows(roomId),
      ]);

      const sortedRows = [...rows].sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR")
      );

      const seatsByRow: Record<string, AdminSeat[]> = {};
      await Promise.all(
        sortedRows.map(async (row) => {
          seatsByRow[row.id] = await adminApi.listAllSeats(row.id);
        })
      );

      setState({ room, rows: sortedRows, seatsByRow, status: "ready" });
    } catch {
      setState({
        message: "Não foi possível carregar o layout da sala. Tente novamente.",
        status: "error",
      });
    }
  }, [roomId]);

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

    setIsCreatingRow(true);
    setCreateRowError(null);
    try {
      const created = await adminApi.createSeatRow({ name, room: roomId });
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        const newRows = [...prev.rows, created].sort((a, b) =>
          a.name.localeCompare(b.name, "pt-BR")
        );
        return {
          ...prev,
          rows: newRows,
          seatsByRow: { ...prev.seatsByRow, [created.id]: [] },
        };
      });
      setNewRowName("");
      setShowCreateRow(false);
    } catch (err) {
      const constraintMsg = extractConstraintMessage(err);
      if (constraintMsg) {
        setCreateRowError(constraintMsg);
      } else if (err instanceof ApiError && err.code === "VALIDATION_FAILED") {
        const details = err.details as Record<string, unknown> | null;
        const nameErr = details?.name;
        setCreateRowError(
          Array.isArray(nameErr) ? nameErr[0] : String(nameErr ?? "Nome inválido.")
        );
      } else {
        setCreateRowError("Não foi possível criar a fileira. Tente novamente.");
      }
    } finally {
      setIsCreatingRow(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
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
      const constraintMsg = extractConstraintMessage(err);
      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return prev;
      });
      if (constraintMsg) {
        setState((prev) => {
          if (prev.status !== "ready") return prev;
          return { ...prev };
        });
        alert(constraintMsg);
      }
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

  function handleSeatUpdated(rowId: string, updated: AdminSeat) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        seatsByRow: {
          ...prev.seatsByRow,
          [rowId]: (prev.seatsByRow[rowId] ?? []).map((s) =>
            s.id === updated.id ? updated : s
          ),
        },
      };
    });
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
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const { room, rows, seatsByRow } = state;
  const totalSeats = rows.reduce(
    (sum, row) => sum + (seatsByRow[row.id]?.length ?? 0),
    0
  );
  const capacityUsed = Math.round((totalSeats / room.capacity) * 100);
  const isNearCapacity = totalSeats >= room.capacity;

  const deleteDialogProps = deleteTarget
    ? deleteTarget.kind === "row"
      ? {
          description: `Excluir a fileira "${deleteTarget.row.name}" removerá todos os seus assentos. Esta ação não pode ser desfeita.`,
          title: `Excluir fileira ${deleteTarget.row.name}`,
        }
      : {
          description: `Tem certeza que deseja excluir o assento ${deleteTarget.rowName}${deleteTarget.seat.number}?`,
          title: "Excluir assento",
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
              {showPreview ? "Ocultar prévia" : "Prévia do mapa"}
            </Button>
            <ButtonLink
              href={`/admin/rooms/${room.id}/edit`}
              size="sm"
              variant="ghost"
            >
              Editar sala
            </ButtonLink>
          </div>
        }
        title={`Layout — ${room.display_name || room.name}`}
      />

      {/* Room info bar */}
      <div className="flex flex-wrap gap-4 rounded-[8px] border border-white/[0.07] bg-white/[0.02] p-4 text-sm">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white/40">
            Sala
          </span>
          <span className="font-bold text-white">{room.name}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white/40">
            Capacidade
          </span>
          <span
            className={cn(
              "font-bold",
              isNearCapacity ? "text-warning" : "text-white"
            )}
          >
            {totalSeats} / {room.capacity} lugares
            {capacityUsed > 0
              ? ` (${isNearCapacity ? "cheio" : `${capacityUsed}%`})`
              : ""}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider text-white/40">
            Fileiras
          </span>
          <span className="font-bold text-white">{rows.length}</span>
        </div>
      </div>

      {/* Seat map preview */}
      {showPreview ? (
        <div className="rounded-[8px] border border-white/[0.07] bg-white/[0.02] p-4">
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
            Prévia do mapa de assentos
          </p>
          <SeatMapPreview rows={rows} seatsByRow={seatsByRow} />
        </div>
      ) : null}

      {/* Seat rows */}
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-white/60">
            Fileiras
          </h2>
          <Button
            onClick={() => {
              setShowCreateRow(true);
              setNewRowName("");
              setCreateRowError(null);
            }}
            size="sm"
            variant="secondary"
          >
            + Adicionar fileira
          </Button>
        </div>

        {showCreateRow ? (
          <div className="flex flex-col gap-2 rounded-[8px] border border-brand/30 bg-brand/5 p-4">
            <span className="text-sm font-extrabold text-white">
              Nova fileira
            </span>
            <p className="text-xs text-white/50">
              Use letras (A–Z). A fileira será ordenada automaticamente.
            </p>
            <div className="flex gap-2">
              <input
                className={[
                  "flex-1 min-h-[var(--control-height-lg)] rounded-control border bg-surface px-3 py-2",
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
                placeholder="Ex.: A"
                ref={createRowInputRef}
                value={newRowName}
              />
              <Button
                disabled={isCreatingRow || !newRowName.trim()}
                isLoading={isCreatingRow}
                onClick={handleCreateRow}
                size="sm"
                type="button"
                variant="primary"
              >
                Criar
              </Button>
              <Button
                disabled={isCreatingRow}
                onClick={() => {
                  setShowCreateRow(false);
                  setNewRowName("");
                  setCreateRowError(null);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                Cancelar
              </Button>
            </div>
            {createRowError ? (
              <p className="text-sm font-bold text-error" role="alert">
                {createRowError}
              </p>
            ) : null}
          </div>
        ) : null}

        {rows.length === 0 && !showCreateRow ? (
          <div className="flex flex-col items-center gap-2 rounded-[8px] border border-dashed border-white/[0.10] py-10 text-center">
            <p className="text-sm font-bold text-white/50">
              Nenhuma fileira cadastrada
            </p>
            <p className="text-xs text-white/30">
              Adicione fileiras para começar a configurar o layout da sala.
            </p>
          </div>
        ) : null}

        {rows.map((row) => {
          const seats = seatsByRow[row.id] ?? [];
          return (
            <div
              className="rounded-[8px] border border-white/[0.07] bg-white/[0.02] p-4"
              key={row.id}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-white/[0.08] text-sm font-extrabold text-white">
                    {row.name}
                  </span>
                  <span className="text-xs text-white/40">
                    {seats.length} assento{seats.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <Button
                  onClick={() => setDeleteTarget({ kind: "row", row })}
                  size="sm"
                  variant="danger"
                >
                  Excluir fileira
                </Button>
              </div>

              <RowEditor
                capacity={room.capacity}
                onSeatAdded={(seat) => handleSeatAdded(row.id, seat)}
                onSeatDelete={(seat) =>
                  setDeleteTarget({ kind: "seat", rowName: row.name, seat })
                }
                onSeatUpdated={(seat) => handleSeatUpdated(row.id, seat)}
                row={row}
                seats={seats}
                totalSeats={totalSeats}
              />
            </div>
          );
        })}
      </div>

      <AdminConfirmDialog
        confirmLabel={isDeleting ? "Excluindo..." : "Excluir"}
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
