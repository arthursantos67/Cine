"use client";

import { useCallback, useEffect, useState } from "react";

import { adminApi, type AdminPermissionLogEntry, type AdminUser } from "@/api/admin";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminConfirmDialog, AdminTable, AdminToolbar } from "@/components/admin";
import type { AdminTableColumn } from "@/components/admin";

type PermissionAction = "grant" | "revoke";

type PendingAction = {
  action: PermissionAction;
  user: AdminUser;
};

type AuditPanelProps = {
  logs: AdminPermissionLogEntry[];
  onClose: () => void;
  username: string;
};

function AuditPanel({ logs, onClose, username }: AuditPanelProps) {
  return (
    <div className="mt-4 rounded-[10px] border border-white/[0.07] bg-surface-muted p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-[750] text-white/70">
          Histórico de permissões — {username}
        </h2>
        <button
          aria-label="Fechar histórico"
          className="text-xs text-white/40 hover:text-white/70"
          onClick={onClose}
          type="button"
        >
          Fechar
        </button>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-white/40">Nenhuma alteração registrada.</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((entry, i) => (
            <li className="flex flex-wrap items-center gap-2 text-sm" key={i}>
              <Badge size="sm" tone={entry.action === "granted" ? "success" : "danger"}>
                {entry.action === "granted" ? "Promovido" : "Rebaixado"}
              </Badge>
              <span className="text-white/60">
                por <span className="text-white/80">{entry.actor}</span>
              </span>
              <span className="text-white/30 tabular-nums">
                {new Date(entry.created_at).toLocaleString("pt-BR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AdminUserList() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [auditUser, setAuditUser] = useState<AdminUser | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminPermissionLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const result = await adminApi.listUsers({ search: search || undefined });
      setUsers(result.results);
    } catch {
      setErrorMessage("Não foi possível carregar os usuários. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function openAuditPanel(user: AdminUser) {
    setAuditUser(user);
    setAuditLogs([]);
    setAuditLoading(true);
    try {
      const logs = await adminApi.getUserPermissionLogs(user.id);
      setAuditLogs(logs);
    } finally {
      setAuditLoading(false);
    }
  }

  const adminCount = users.filter((u) => u.is_staff).length;

  function requestAction(user: AdminUser, action: PermissionAction) {
    setActionError(null);
    setPendingAction({ action, user });
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setIsActing(true);
    setActionError(null);
    try {
      const updated =
        pendingAction.action === "grant"
          ? await adminApi.grantAdmin(pendingAction.user.id)
          : await adminApi.revokeAdmin(pendingAction.user.id);

      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, is_staff: updated.is_staff } : u))
      );
      setPendingAction(null);

      if (auditUser?.id === updated.id) {
        openAuditPanel({ ...auditUser, is_staff: updated.is_staff });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes("last active administrator")
          ? "Não é possível remover o último administrador ativo."
          : "Não foi possível concluir a operação. Tente novamente.";
      setActionError(msg);
    } finally {
      setIsActing(false);
    }
  }

  const columns: AdminTableColumn<AdminUser & Record<string, unknown>>[] = [
    {
      key: "username",
      label: "Usuário",
      render: (row) => (
        <span className="font-medium text-white">{row.username}</span>
      ),
    },
    {
      key: "email",
      label: "E-mail",
    },
    {
      key: "is_staff",
      label: "Perfil",
      render: (row) =>
        row.is_staff ? (
          <Badge size="sm" tone="brand">
            Admin
          </Badge>
        ) : (
          <Badge size="sm" tone="neutral">
            Usuário
          </Badge>
        ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (row) => {
        const isLastAdmin = row.is_staff && adminCount <= 1;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              aria-label={`Ver histórico de ${row.username}`}
              className="text-xs text-white/40 hover:text-white/70 transition"
              onClick={() => openAuditPanel(row as AdminUser)}
              type="button"
            >
              Histórico
            </button>
            {row.is_staff ? (
              <Button
                disabled={isLastAdmin}
                onClick={() => requestAction(row as AdminUser, "revoke")}
                size="sm"
                title={
                  isLastAdmin
                    ? "Não é possível remover o último administrador"
                    : undefined
                }
                variant="danger"
              >
                Remover admin
              </Button>
            ) : (
              <Button
                onClick={() => requestAction(row as AdminUser, "grant")}
                size="sm"
                variant="secondary"
              >
                Tornar admin
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const confirmTitle =
    pendingAction?.action === "grant"
      ? `Promover ${pendingAction.user.username} a administrador?`
      : `Remover permissão admin de ${pendingAction?.user.username}?`;

  const confirmDescription =
    pendingAction?.action === "grant"
      ? "Este usuário terá acesso total ao painel de administração."
      : "Este usuário perderá o acesso ao painel de administração.";

  return (
    <div className="grid gap-6">
      <AdminToolbar
        onSearch={setSearchInput}
        searchPlaceholder="Buscar por e-mail ou usuário..."
        title="Administradores"
      />

      {errorMessage ? (
        <p className="text-sm text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <AdminTable
        caption="Lista de usuários do sistema"
        columns={columns as AdminTableColumn<Record<string, unknown>>[]}
        data={users as (AdminUser & Record<string, unknown>)[]}
        emptyDescription="Nenhum usuário encontrado com os critérios informados."
        emptyTitle="Nenhum usuário"
        keyField="id"
        loading={loading}
      />

      {auditUser ? (
        auditLoading ? (
          <div className="mt-4 h-16 animate-pulse rounded-[10px] bg-white/[0.04]" />
        ) : (
          <AuditPanel
            logs={auditLogs}
            onClose={() => setAuditUser(null)}
            username={auditUser.username}
          />
        )
      ) : null}

      {pendingAction ? (
        <AdminConfirmDialog
          confirmLabel={
            isActing
              ? "Aguarde..."
              : pendingAction.action === "grant"
                ? "Promover"
                : "Remover admin"
          }
          description={confirmDescription}
          isOpen
          onCancel={() => {
            if (isActing) return;
            setPendingAction(null);
            setActionError(null);
          }}
          onConfirm={confirmAction}
          title={confirmTitle}
          tone={pendingAction.action === "revoke" ? "danger" : "default"}
        />
      ) : null}

      {actionError ? (
        <p className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-[8px] bg-[#2a1010] px-4 py-2.5 text-sm text-error shadow-xl" role="alert">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}
