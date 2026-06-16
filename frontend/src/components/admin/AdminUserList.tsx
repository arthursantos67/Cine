"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { adminApi, type AdminPermissionLogEntry, type AdminUser } from "@/api/admin";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminConfirmDialog, AdminTable, AdminToolbar } from "@/components/admin";
import type { AdminTableColumn } from "@/components/admin";
import { useI18n } from "@/i18n";

type GrantRole = "staff" | "master";
type PermissionAction = { kind: "grant"; role: GrantRole } | { kind: "revoke" };

type PendingAction = {
  action: PermissionAction;
  user: AdminUser;
};

function getAuditLabel(
  entry: AdminPermissionLogEntry,
  t: (key: string) => string
): string {
  if (entry.action === "granted") {
    if (entry.role === "master") return t("admin.user.permissionGrantedMaster");
    if (entry.role === "staff") return t("admin.user.permissionGrantedStaff");
    return t("admin.user.permissionGranted");
  }
  if (entry.role === "master") return t("admin.user.permissionRevokedMaster");
  if (entry.role === "staff") return t("admin.user.permissionRevokedStaff");
  return t("admin.user.permissionRevoked");
}

type AuditPanelProps = {
  logs: AdminPermissionLogEntry[];
  onClose: () => void;
  username: string;
};

function AuditPanel({ logs, onClose, username }: AuditPanelProps) {
  const { formatDateTime, t } = useI18n();

  return (
    <div className="mt-4 rounded-[10px] border border-white/[0.07] bg-surface-muted p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-[750] text-white/70">
          {t("admin.user.auditTitle", { username })}
        </h2>
        <button
          aria-label={t("admin.user.auditClose")}
          className="text-xs text-white/40 hover:text-white/70"
          onClick={onClose}
          type="button"
        >
          {t("admin.close")}
        </button>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-white/40">{t("admin.user.auditEmpty")}</p>
      ) : (
        <ul className="space-y-2">
          {logs.map((entry) => (
            <li className="flex flex-wrap items-center gap-2 text-sm" key={`${entry.created_at}-${entry.action}`}>
              <Badge size="sm" tone={entry.action === "granted" ? "success" : "danger"}>
                {getAuditLabel(entry, t)}
              </Badge>
              <span className="text-white/60">
                {t("admin.user.byActor", { actor: entry.actor })}
              </span>
              <span className="text-white/30 tabular-nums">
                {formatDateTime(entry.created_at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: AdminUser["role"] }) {
  const { t } = useI18n();

  if (role === "master") {
    return (
      <Badge size="sm" tone="accent">
        {t("admin.user.roleMaster")}
      </Badge>
    );
  }

  if (role === "staff") {
    return (
      <Badge size="sm" tone="brand">
        {t("admin.user.roleStaff")}
      </Badge>
    );
  }

  return (
    <Badge size="sm" tone="neutral">
      {t("admin.user.roleUser")}
    </Badge>
  );
}

export function AdminUserList() {
  const { t } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [auditUser, setAuditUser] = useState<AdminUser | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminPermissionLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const fetchEpochRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPage = useCallback(async (pageNum: number, replace: boolean) => {
    const epoch = ++fetchEpochRef.current;
    if (replace) {
      setLoading(true);
      setLoadingMore(false);
    } else {
      setLoadingMore(true);
    }
    setErrorMessage(null);
    try {
      const result = await adminApi.listUsers({ page: pageNum, search: search || undefined });
      if (epoch !== fetchEpochRef.current) return;
      setUsers((prev) => (replace ? result.results : [...prev, ...result.results]));
      setHasMore(result.next !== null);
      setPage(pageNum);
    } catch {
      if (epoch !== fetchEpochRef.current) return;
      setErrorMessage(t("admin.user.loadError"));
    } finally {
      if (epoch === fetchEpochRef.current) {
        if (replace) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    }
  }, [search, t]);

  useEffect(() => {
    setUsers([]);
    fetchPage(1, true);
  }, [fetchPage]);

  async function openAuditPanel(user: AdminUser) {
    setAuditUser(user);
    setAuditLogs([]);
    setAuditLoading(true);
    try {
      const logs = await adminApi.getUserPermissionLogs(user.id);
      setAuditLogs(logs);
    } catch {
      setActionError(t("admin.user.auditLoadError"));
    } finally {
      setAuditLoading(false);
    }
  }

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
        pendingAction.action.kind === "grant"
          ? await adminApi.grantAdmin(pendingAction.user.id, pendingAction.action.role)
          : await adminApi.revokeAdmin(pendingAction.user.id);

      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id
            ? { ...u, is_staff: updated.is_staff, role: updated.role }
            : u
        )
      );
      setPendingAction(null);

      if (auditUser?.id === updated.id) {
        openAuditPanel({ ...auditUser, is_staff: updated.is_staff, role: updated.role });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error && err.message.includes("primary admin account")
          ? t("admin.user.masterProtected")
          : t("admin.user.operationError");
      setActionError(msg);
    } finally {
      setIsActing(false);
    }
  }

  const columns: AdminTableColumn<AdminUser & Record<string, unknown>>[] = [
    {
      key: "username",
      label: t("admin.user.username"),
      render: (row) => (
        <span className="font-medium text-white">{row.username}</span>
      ),
    },
    {
      key: "email",
      label: "E-mail",
    },
    {
      key: "role",
      label: t("admin.user.profile"),
      render: (row) => <RoleBadge role={(row as AdminUser).role} />,
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (row) => {
        const user = row as AdminUser;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              aria-label={t("admin.user.viewAuditFor", { username: row.username as string })}
              className="text-xs text-white/40 hover:text-white/70 transition"
              onClick={() => openAuditPanel(user)}
              type="button"
            >
              {t("admin.user.auditLabel")}
            </button>

            {user.role === "master" ? (
              user.is_protected ? null : (
                <>
                  <Button
                    onClick={() => requestAction(user, { kind: "grant", role: "staff" })}
                    size="sm"
                    variant="secondary"
                  >
                    {t("admin.user.grantStaff")}
                  </Button>
                  <Button
                    onClick={() => requestAction(user, { kind: "revoke" })}
                    size="sm"
                    variant="danger"
                  >
                    {t("admin.user.revoke")}
                  </Button>
                </>
              )
            ) : user.role === "staff" ? (
              <>
                <Button
                  onClick={() => requestAction(user, { kind: "grant", role: "master" })}
                  size="sm"
                  variant="secondary"
                >
                  {t("admin.user.grantMaster")}
                </Button>
                <Button
                  onClick={() => requestAction(user, { kind: "revoke" })}
                  size="sm"
                  variant="danger"
                >
                  {t("admin.user.revoke")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => requestAction(user, { kind: "grant", role: "staff" })}
                  size="sm"
                  variant="secondary"
                >
                  {t("admin.user.grantStaff")}
                </Button>
                <Button
                  onClick={() => requestAction(user, { kind: "grant", role: "master" })}
                  size="sm"
                  variant="secondary"
                >
                  {t("admin.user.grantMaster")}
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const confirmTitle = pendingAction
    ? pendingAction.action.kind === "grant"
      ? pendingAction.action.role === "master"
        ? t("admin.user.grantMasterTitle", { username: pendingAction.user.username })
        : t("admin.user.grantStaffTitle", { username: pendingAction.user.username })
      : t("admin.user.revokeTitle", { username: pendingAction.user.username })
    : "";

  const confirmDescription = pendingAction
    ? pendingAction.action.kind === "grant"
      ? pendingAction.action.role === "master"
        ? t("admin.user.grantMasterDescription")
        : t("admin.user.grantStaffDescription")
      : t("admin.user.revokeDescription")
    : "";

  const confirmLabel = isActing
    ? t("admin.user.wait")
    : pendingAction?.action.kind === "revoke"
      ? t("admin.user.revoke")
      : t("admin.user.grantConfirm");

  return (
    <div className="grid gap-6">
      <AdminToolbar
        onSearch={setSearchInput}
        searchPlaceholder={t("admin.user.search")}
        title={t("admin.users")}
      />

      {errorMessage ? (
        <p className="text-sm text-error" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <AdminTable
        caption={t("admin.user.caption")}
        columns={columns as AdminTableColumn<Record<string, unknown>>[]}
        data={users as (AdminUser & Record<string, unknown>)[]}
        emptyDescription={t("admin.user.emptyDescription")}
        emptyTitle={t("admin.user.emptyTitle")}
        keyField="id"
        loading={loading}
      />

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            disabled={loadingMore}
            onClick={() => fetchPage(page + 1, false)}
            variant="ghost"
          >
            {loadingMore ? t("admin.user.loadingMore") : t("admin.user.loadMore")}
          </Button>
        </div>
      ) : null}

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
          confirmLabel={confirmLabel}
          description={confirmDescription}
          isOpen
          onCancel={() => {
            if (isActing) return;
            setPendingAction(null);
            setActionError(null);
          }}
          onConfirm={confirmAction}
          title={confirmTitle}
          tone={pendingAction.action.kind === "revoke" ? "danger" : "default"}
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
