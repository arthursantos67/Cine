"use client";

import { useEffect, useState, type FormEvent } from "react";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n";
import {
  getLoginConfirmationMessage,
  getLoginFormErrorMessage,
  getSafeRedirectFromSearch,
} from "./auth-form-utils";

export type LoginFormViewProps = {
  confirmationMessage: string | null;
  errorMessage: string | null;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LoginFormView({
  confirmationMessage,
  errorMessage,
  isSubmitting,
  onSubmit,
}: LoginFormViewProps) {
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const formErrorId = errorMessage ? "login-form-error" : undefined;

  return (
    <div className="grid gap-5 rounded-lg border border-white/[0.1] bg-white/[0.04] p-6">
      {confirmationMessage ? (
        <p className="inline-status inline-status-success" role="status">
          {confirmationMessage}
        </p>
      ) : null}
      <form
        action=""
        aria-describedby={formErrorId}
        className="grid gap-5"
        method="post"
        onSubmit={onSubmit}
      >
        <div className="grid gap-1.5">
          <label className="text-sm font-[800] text-text" htmlFor="email">
            {t("auth.email")}
          </label>
          <input
            className="auth-field"
            aria-describedby={formErrorId}
            aria-invalid={errorMessage ? "true" : undefined}
            autoComplete="email"
            disabled={isSubmitting}
            id="email"
            name="email"
            placeholder={t("auth.emailPlaceholder")}
            required
            type="email"
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-[800] text-text" htmlFor="password">
            {t("auth.password")}
          </label>
          <div className="relative">
            <input
              className="auth-field pr-11"
              aria-describedby={formErrorId}
              aria-invalid={errorMessage ? "true" : undefined}
              autoComplete="current-password"
              disabled={isSubmitting}
              id="password"
              name="password"
              placeholder={t("auth.passwordPlaceholder")}
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-text/50 transition-colors hover:text-text"
              disabled={isSubmitting}
              onClick={() => setShowPassword((v) => !v)}
              type="button"
            >
              {showPassword
                ? <EyeOff aria-hidden="true" size={18} />
                : <Eye aria-hidden="true" size={18} />}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            className="h-[18px] w-[18px] flex-shrink-0 cursor-pointer"
            disabled={isSubmitting}
            id="stayLoggedIn"
            name="stayLoggedIn"
            type="checkbox"
          />
          <label className="cursor-pointer text-sm text-text/70" htmlFor="stayLoggedIn">
            {t("auth.stayLoggedIn")}
          </label>
        </div>
        {errorMessage ? (
          <p className="form-error" id="login-form-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? t("auth.loginSubmitting") : t("auth.login")}
        </button>
      </form>
    </div>
  );
}

export function LoginForm() {
  const { locale } = useI18n();
  const router = useRouter();
  const { loading, login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(
    null
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const stayLoggedIn = formData.get("stayLoggedIn") === "on";

    try {
      await login({ email, password }, { stayLoggedIn });
      const search = typeof window === "undefined" ? "" : window.location.search;
      router.replace(getSafeRedirectFromSearch(search));
    } catch (error) {
      setErrorMessage(getLoginFormErrorMessage(error, locale));
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      setConfirmationMessage(getLoginConfirmationMessage(window.location.search, locale));
    }
  }, [locale]);

  return (
    <LoginFormView
      confirmationMessage={confirmationMessage}
      errorMessage={errorMessage}
      isSubmitting={loading}
      onSubmit={handleSubmit}
    />
  );
}
