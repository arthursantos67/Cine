"use client";

import { useEffect, type ReactNode } from "react";

import { useRouter } from "next/navigation";

import { buildLoginRedirectUrl } from "@/api/client";
import { StateMessage } from "@/components/ui/StateMessage";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n";
import {
  getBrowserCurrentPath,
  getProtectedRouteDecision,
} from "./route-guards";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, status } = useAuth();
  const { t } = useI18n();
  const decision = getProtectedRouteDecision({ isAuthenticated, status });

  useEffect(() => {
    if (decision.redirectToLogin) {
      router.replace(buildLoginRedirectUrl(getBrowserCurrentPath()));
    }
  }, [decision.redirectToLogin, router]);

  if (decision.renderContent) {
    return children;
  }

  return (
    <StateMessage tone="loading" title={t("auth.checkingAccess")}>
      {t("auth.checkingAccessDescription")}
    </StateMessage>
  );
}
