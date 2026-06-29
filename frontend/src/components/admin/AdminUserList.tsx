"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { adminApi, type AdminPermissionLogEntry, type AdminUser } from "@/api/admin";
import { ApiError } from "@/api/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminConfirmDialog, AdminTable, AdminToolbar } from "@/components/admin";
import type { AdminTableColumn } from "@/components/admin";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n";

type RoleFilter = "" | "master" | "staff" | "user";
type GrantRole = "staff" | "master";
type PermissionAction = { kind: "grant"; role: GrantRole } | { kind: "revoke" };

type PendingAction = {
  action: PermissionAction;
  user: AdminUser;
};

function getAuditLabel(
  entry: AdminPermissionLogEntry,
  t: (key: string, vars?: Record<string, string>) => string,
  viewedUsername: string
): string {
  const isActor = entry.actor === viewedUsername;

  if (entry.action === "deleted") {
    return isActor
      ? t("admin.user.actorDeleted", { target: entry.target })
      : t("admin.user.accountDeleted", { actor: entry.actor });
  }

  if (isActor) {
    if (entry.action === "granted") {
      if (entry.role === "master") return t("admin.user.actorGrantedMaster", { target: entry.target });
      return t("admin.user.actorGrantedStaff", { target: entry.target });
    }
    if (entry.role === "master") return t("admin.user.actorRevokedMaster", { target: entry.target });
    if (entry.role === "staff") return t("admin.user.actorRevokedStaff", { target: entry.target });
    return t("admin.user.actorRevoked", { target: entry.target });
  }

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
          {logs.map((entry) => {
            const isActor = entry.actor === username;
            const badgeTone = entry.action === "granted" ? "success" : "danger";
            return (
              <li className="flex flex-wrap items-center gap-2 text-sm" key={`${entry.created_at}-${entry.action}-${entry.target}`}>
                <Badge size="sm" tone={badgeTone}>
                  {getAuditLabel(entry, t, username)}
                </Badge>
                {!isActor && (
                  <span className="text-white/60">
                    {t("admin.user.byActor", { actor: entry.actor })}
                  </span>
                )}
                <span className="text-white/30 tabular-nums">
                  {formatDateTime(entry.created_at)}
                </span>
              </li>
            );
          })}
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

type DeleteStep = "confirm" | "confirm-tickets" | "elect-master" | "transfer-protection";

export function AdminUserList() {
  const { t } = useI18n();
  const { signOut, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [auditUser, setAuditUser] = useState<AdminUser | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminPermissionLogEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteStep, setDeleteStep] = useState<DeleteStep | null>(null);
  const [deleteTicketCount, setDeleteTicketCount] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [electMasterUserId, setElectMasterUserId] = useState("");
  const [transferProtectionUserId, setTransferProtectionUserId] = useState("");
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
      const result = await adminApi.listUsers({ page: pageNum, search: search || undefined, role: roleFilter || undefined });
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
  }, [roleFilter, search, t]);

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

  function requestDelete(user: AdminUser) {
    setDeleteError(null);
    setDeleteTarget(user);
    setDeleteStep("confirm");
  }

  function cancelDelete() {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteStep(null);
    setDeleteTicketCount(0);
    setDeleteError(null);
    setDeletePassword("");
    setDeletePasswordError(null);
    setElectMasterUserId("");
    setTransferProtectionUserId("");
  }

  async function confirmDelete() {
    if (!deleteTarget || !deleteStep) return;

    if (deleteStep === "elect-master") {
      await confirmElectAndDelete();
      return;
    }

    if (deleteStep === "transfer-protection") {
      await confirmTransferAndDelete();
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    setDeletePasswordError(null);

    const withConfirm = deleteStep === "confirm-tickets";
    const isSelf = deleteTarget.id === currentUser?.id;
    const transferTo = deleteTarget.is_protected && transferProtectionUserId ? transferProtectionUserId : undefined;

    try {
      if (isSelf) {
        await adminApi.deleteSelfAccount({ confirm: withConfirm, password: deletePassword, transfer_to: transferTo });
        signOut();
      } else {
        await adminApi.deleteUser(deleteTarget.id, { confirm: withConfirm, password: deletePassword });
        setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
        if (auditUser?.id === deleteTarget.id) setAuditUser(null);
        setDeleteTarget(null);
        setDeleteStep(null);
        setDeleteTicketCount(0);
        setDeletePassword("");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409 && err.code === "HAS_ACTIVE_TICKETS") {
        const count = (err.details as { ticket_count?: number })?.ticket_count ?? 0;
        setDeleteTicketCount(count);
        setDeleteStep("confirm-tickets");
      } else if (err instanceof ApiError && err.code === "ONLY_MASTER_ADMIN") {
        setDeleteStep("elect-master");
      } else if (err instanceof ApiError && err.code === "PROTECTED_TRANSFER_REQUIRED") {
        setDeleteStep("transfer-protection");
      } else if (err instanceof ApiError && err.code === "WRONG_PASSWORD") {
        setDeletePasswordError(t("admin.user.deletePasswordError"));
      } else if (err instanceof ApiError && err.status === 400) {
        const details = err.details as Record<string, unknown> | null;
        const fieldErrors = details?.non_field_errors;
        const firstError = Array.isArray(fieldErrors) ? String(fieldErrors[0]) : null;
        setDeleteError(firstError ?? t("admin.user.deleteError"));
      } else {
        setDeleteError(t("admin.user.deleteError"));
      }
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmElectAndDelete() {
    if (!deleteTarget || !electMasterUserId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const promoted = await adminApi.grantAdmin(electMasterUserId, "master");
      setUsers((prev) =>
        prev.map((u) => (u.id === promoted.id ? { ...u, is_staff: promoted.is_staff, role: promoted.role } : u))
      );
      const transferTo = deleteTarget.is_protected ? electMasterUserId : undefined;
      await adminApi.deleteSelfAccount({ password: deletePassword, transfer_to: transferTo });
      signOut();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409 && err.code === "HAS_ACTIVE_TICKETS") {
        const count = (err.details as { ticket_count?: number })?.ticket_count ?? 0;
        setDeleteTicketCount(count);
        setTransferProtectionUserId(electMasterUserId);
        setDeleteStep("confirm-tickets");
      } else {
        setDeleteError(t("admin.user.deleteError"));
      }
    } finally {
      setIsDeleting(false);
    }
  }

  async function confirmTransferAndDelete() {
    if (!deleteTarget || !transferProtectionUserId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await adminApi.deleteSelfAccount({ password: deletePassword, transfer_to: transferProtectionUserId });
      signOut();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409 && err.code === "HAS_ACTIVE_TICKETS") {
        const count = (err.details as { ticket_count?: number })?.ticket_count ?? 0;
        setDeleteTicketCount(count);
        setDeleteStep("confirm-tickets");
      } else {
        setDeleteError(t("admin.user.deleteError"));
      }
    } finally {
      setIsDeleting(false);
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
        const isSelf = currentUser?.id === user.id;
        const canDelete = !user.is_protected || isSelf;

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

            {canDelete ? (
              <Button
                onClick={() => requestDelete(user)}
                size="sm"
                variant="danger"
              >
                {t("admin.user.delete")}
              </Button>
            ) : null}

            {!isSelf && user.role === "master" ? (
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
            ) : !isSelf && user.role === "staff" ? (
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
            ) : !isSelf ? (
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
            ) : null}
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

  const roleFilterOptions: { label: string; value: RoleFilter }[] = [
    { label: t("admin.user.filterAll"), value: "" },
    { label: t("admin.user.roleMaster"), value: "master" },
    { label: t("admin.user.roleStaff"), value: "staff" },
    { label: t("admin.user.roleUser"), value: "user" },
  ];

  return (
    <div className="grid gap-6">
      <AdminToolbar
        filters={
          <div className="flex gap-1.5">
            {roleFilterOptions.map(({ label, value }) => (
              <button
                className={[
                  "rounded-[6px] border px-2.5 py-1 text-xs font-medium transition",
                  roleFilter === value
                    ? "border-brand/50 bg-brand/15 text-brand"
                    : "border-white/[0.10] bg-white/[0.04] text-white/50 hover:border-white/20 hover:text-white/70",
                ].join(" ")}
                key={value}
                onClick={() => { setRoleFilter(value); }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        }
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

      {deleteStep === "confirm" && deleteTarget ? (
        <AdminConfirmDialog
          confirmDisabled={!deletePassword.trim() || isDeleting}
          confirmLabel={isDeleting ? t("admin.user.wait") : t("admin.user.deleteConfirm")}
          description={t("admin.user.deleteDescription", { username: deleteTarget.username })}
          isOpen
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          title={t("admin.user.deleteTitle", { username: deleteTarget.username })}
          tone="danger"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/60" htmlFor="delete-password">
              {t("admin.user.deletePasswordLabel")}
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-[8px] border border-white/[0.10] bg-white/[0.05] px-3 py-2 text-sm text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
              disabled={isDeleting}
              id="delete-password"
              onChange={(e) => { setDeletePassword(e.target.value); setDeletePasswordError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && deletePassword.trim() && !isDeleting) confirmDelete(); }}
              placeholder="••••••••"
              type="password"
              value={deletePassword}
            />
            {deletePasswordError ? (
              <p className="text-xs text-error">{deletePasswordError}</p>
            ) : null}
          </div>
        </AdminConfirmDialog>
      ) : null}

      {deleteStep === "elect-master" && deleteTarget ? (() => {
        const eligible = users.filter((u) => u.role !== "master" && u.id !== deleteTarget.id);
        return (
          <AdminConfirmDialog
            confirmDisabled={!electMasterUserId || isDeleting}
            confirmLabel={isDeleting ? t("admin.user.wait") : t("admin.user.electMasterConfirm")}
            description={t("admin.user.electMasterDescription")}
            isOpen
            onCancel={cancelDelete}
            onConfirm={confirmDelete}
            title={t("admin.user.electMasterTitle")}
            tone="danger"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/60" htmlFor="elect-master-select">
                {t("admin.user.electMasterSelectLabel")}
              </label>
              {eligible.length === 0 ? (
                <p className="text-sm text-white/40">{t("admin.user.electMasterNoUsers")}</p>
              ) : (
                <select
                  className="w-full rounded-[8px] border border-white/[0.10] bg-[#1a2030] px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
                  disabled={isDeleting}
                  id="elect-master-select"
                  onChange={(e) => setElectMasterUserId(e.target.value)}
                  value={electMasterUserId}
                >
                  <option disabled value="">{t("admin.user.electMasterSelectPlaceholder")}</option>
                  {eligible.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </AdminConfirmDialog>
        );
      })() : null}

      {deleteStep === "transfer-protection" && deleteTarget ? (() => {
        const eligibleMasters = users.filter((u) => u.role === "master" && u.id !== deleteTarget.id);
        return (
          <AdminConfirmDialog
            confirmDisabled={!transferProtectionUserId || isDeleting}
            confirmLabel={isDeleting ? t("admin.user.wait") : t("admin.user.transferProtectionConfirm")}
            description={t("admin.user.transferProtectionDescription")}
            isOpen
            onCancel={cancelDelete}
            onConfirm={confirmDelete}
            title={t("admin.user.transferProtectionTitle")}
            tone="danger"
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-white/60" htmlFor="transfer-protection-select">
                {t("admin.user.transferProtectionSelectLabel")}
              </label>
              {eligibleMasters.length === 0 ? (
                <p className="text-sm text-white/40">{t("admin.user.transferProtectionNoUsers")}</p>
              ) : (
                <select
                  className="w-full rounded-[8px] border border-white/[0.10] bg-[#1a2030] px-3 py-2 text-sm text-white focus:border-white/20 focus:outline-none"
                  disabled={isDeleting}
                  id="transfer-protection-select"
                  onChange={(e) => setTransferProtectionUserId(e.target.value)}
                  value={transferProtectionUserId}
                >
                  <option disabled value="">{t("admin.user.transferProtectionSelectPlaceholder")}</option>
                  {eligibleMasters.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </AdminConfirmDialog>
        );
      })() : null}

      {deleteStep === "confirm-tickets" && deleteTarget ? (
        <AdminConfirmDialog
          confirmDisabled={isDeleting}
          confirmLabel={isDeleting ? t("admin.user.wait") : t("admin.user.deleteConfirm")}
          description={t("admin.user.deleteTicketsDescription", { username: deleteTarget.username, count: String(deleteTicketCount) })}
          isOpen
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          title={t("admin.user.deleteTicketsTitle", { username: deleteTarget.username })}
          tone="danger"
        />
      ) : null}

      {deleteError ? (
        <p className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-[8px] bg-[#2a1010] px-4 py-2.5 text-sm text-error shadow-xl" role="alert">
          {deleteError}
        </p>
      ) : null}
    </div>
  );
}
