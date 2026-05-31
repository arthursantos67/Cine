"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/components/ui/classNames";

type ConfirmTone = "danger" | "default";

type AdminConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description?: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  tone?: ConfirmTone;
};

export function AdminConfirmDialog({
  cancelLabel = "Cancelar",
  confirmLabel = "Confirmar",
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
  tone = "default",
}: AdminConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      aria-labelledby="confirm-dialog-title"
      className={cn(
        "w-full max-w-sm rounded-[10px] border border-white/[0.10]",
        "bg-[#1a2030] p-6 text-white shadow-xl backdrop:bg-black/60",
        "open:flex open:flex-col open:gap-4"
      )}
      onCancel={onCancel}
      ref={dialogRef}
    >
      <div className="flex flex-col gap-1.5">
        <strong className="text-base font-[850]" id="confirm-dialog-title">
          {title}
        </strong>
        {description ? (
          <p className="text-sm text-white/60">{description}</p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} variant="ghost">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant={tone === "danger" ? "danger" : "primary"}
        >
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
