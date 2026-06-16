"use client";

import { useEffect, type ReactNode } from "react";

import { useRouter } from "next/navigation";

import { buildLoginRedirectUrl } from "@/api/client";
import { StateMessage } from "@/components/ui/StateMessage";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n";
import { getBrowserCurrentPath } from "./route-guards";

type MasterRouteProps = {
  children: ReactNode;
};

export function MasterRoute({ children }: MasterRouteProps) {
  const router = useRouter();
  const { isAuthenticated, status, user } = useAuth();
  const { t } = useI18n();
  const isMaster = user?.role === "master";

  useEffect(() => {
    if (status !== "loading" && !isAuthenticated) {
      router.replace(buildLoginRedirectUrl(getBrowserCurrentPath()));
    }
  }, [status, isAuthenticated, router]);

  if (status === "loading") {
    return (
      <StateMessage tone="loading" title={t("auth.checkingAccess")}>
        {t("auth.checkingAccessDescription")}
      </StateMessage>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!isMaster) {
    return (
      <StateMessage tone="error" title={t("auth.restrictedAccess")}>
        {t("auth.restrictedAccessDescription")}
      </StateMessage>
    );
  }

  return children;
}
