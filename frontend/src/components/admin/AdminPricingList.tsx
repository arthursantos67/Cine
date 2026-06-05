"use client";

import { useEffect, useId, useState } from "react";

import { adminApi } from "@/api/admin";
import type { RoomTypePricing } from "@/types/catalog";
import { formatCurrency } from "@/utils/formatters";
import { Button } from "@/components/ui/Button";
import { AdminToolbar } from "@/components/admin";

const EXPERIENCE_LABELS: Record<string, string> = {
  standard: "Standard",
  vip: "VIP",
  premium: "Premium",
  imax: "IMAX",
};

type EditState = {
  id: number;
  value: string;
};

export function AdminPricingList() {
  const [pricing, setPricing] = useState<RoomTypePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const inputId = useId();

  useEffect(() => {
    adminApi
      .listRoomTypePricing()
      .then(setPricing)
      .catch(() => setErrorMessage("Não foi possível carregar os preços."))
      .finally(() => setLoading(false));
  }, []);

  function startEdit(entry: RoomTypePricing) {
    setEdit({ id: entry.id, value: entry.base_price });
    setSaveError(null);
  }

  function cancelEdit() {
    setEdit(null);
    setSaveError(null);
  }

  async function saveEdit() {
    if (!edit) return;
    const price = Number(edit.value);
    if (!edit.value || isNaN(price) || price <= 0) {
      setSaveError("Informe um valor válido maior que zero.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await adminApi.updateRoomTypePricing(edit.id, {
        base_price: Number(edit.value).toFixed(2),
      });
      setPricing((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEdit(null);
    } catch {
      setSaveError("Não foi possível salvar. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <AdminToolbar title="Preços por tipo de sala" />

      <p className="text-sm text-white/50">
        Define o preço base do ingresso para cada tipo de sala. Sessões em
        sextas, sábados e domingos recebem acréscimo automático de 24%.
        Alterações aplicam-se apenas a sessões futuras.
      </p>

      {errorMessage ? (
        <p className="text-sm font-bold text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-white/40" role="status">
          Carregando preços...
        </p>
      ) : (
        <div className="grid gap-3">
          {pricing.map((entry) => {
            const isEditing = edit?.id === entry.id;
            const label = EXPERIENCE_LABELS[entry.experience_type] ?? entry.experience_type;
            const weekendPrice = Math.round(Number(entry.base_price) * 1.24 * 100) / 100;

            return (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-[8px] border border-white/[0.07] bg-white/[0.02] px-5 py-4 max-sm:grid-cols-1"
                key={entry.id}
              >
                <div className="grid gap-1">
                  <span className="text-sm font-extrabold text-white">
                    {label}
                  </span>
                  {isEditing ? (
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={inputId}>
                          Preço base de {label} em R$
                        </label>
                        <input
                          autoFocus
                          className="min-h-9 w-36 rounded-control border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-brand focus:shadow-focus"
                          id={inputId}
                          min="0.01"
                          onChange={(e) =>
                            setEdit((prev) =>
                              prev ? { ...prev, value: e.target.value } : null
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          placeholder="Ex.: 42.00"
                          step="0.01"
                          type="number"
                          value={edit.value}
                        />
                        <span className="text-xs text-white/40">R$</span>
                      </div>
                      {saveError ? (
                        <p className="text-xs font-bold text-error">{saveError}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <span className="text-sm text-white/60">
                        Dia normal:{" "}
                        <strong className="text-white">
                          {formatCurrency(Number(entry.base_price))}
                        </strong>
                      </span>
                      <span className="text-sm text-white/60">
                        Sex/Sáb/Dom (+24%):{" "}
                        <strong className="text-white">
                          {formatCurrency(weekendPrice)}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        disabled={isSaving}
                        onClick={() => void saveEdit()}
                        size="sm"
                        variant="primary"
                      >
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        disabled={isSaving}
                        onClick={cancelEdit}
                        size="sm"
                        variant="ghost"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => startEdit(entry)}
                      size="sm"
                      variant="ghost"
                    >
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
