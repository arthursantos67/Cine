"use client";

import { useEffect, type ReactNode } from "react";

import { useRouter } from "next/navigation";

import { buildLoginRedirectUrl } from "@/api/client";
import { StateMessage } from "@/components/ui/StateMessage";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBrowserCurrentPath,
  getAdminRouteDecision,
} from "./route-guards";

type AdminRouteProps = {
  children: ReactNode;
};

export function AdminRoute({ children }: AdminRouteProps) {
  const router = useRouter();
  const { isAuthenticated, status, user } = useAuth();
  const isAdmin = Boolean(user?.is_staff);
  const decision = getAdminRouteDecision({ isAdmin, isAuthenticated, status });

  useEffect(() => {
    if (decision.redirectToLogin) {
      router.replace(buildLoginRedirectUrl(getBrowserCurrentPath()));
    }
  }, [decision.redirectToLogin, router]);

  if (decision.renderContent) {
    return children;
  }

  if (decision.redirectToForbidden) {
    return (
      <StateMessage tone="error" title="Acesso restrito">
        Você não tem permissão para acessar esta página.
      </StateMessage>
    );
  }

  return (
    <StateMessage tone="loading" title="Verificando acesso">
      Aguarde enquanto confirmamos sua sessão.
    </StateMessage>
  );
}
