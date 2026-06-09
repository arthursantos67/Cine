"use client";

import { useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { authApi } from "@/api/auth";
import { useI18n } from "@/i18n";
import {
  buildRegisteredLoginUrl,
  getRegistrationValidationState,
  type AuthFieldErrors,
} from "./auth-form-utils";

export type RegisterFormViewProps = {
  fieldErrors: AuthFieldErrors;
  formError: string | null;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function RegisterFormView({
  fieldErrors,
  formError,
  isSubmitting,
  onSubmit,
}: RegisterFormViewProps) {
  const { t } = useI18n();
  const formErrorId = formError ? "register-form-error" : undefined;

  return (
    <div className="panel">
      <form
        aria-describedby={formErrorId}
        className="form-grid"
        onSubmit={onSubmit}
      >
        <div className="form-field">
          <label htmlFor="username">{t("auth.username")}</label>
          <input
            aria-describedby={fieldErrors.username ? "username-error" : undefined}
            aria-invalid={fieldErrors.username ? "true" : undefined}
            autoComplete="username"
            disabled={isSubmitting}
            id="username"
            name="username"
            placeholder={t("auth.usernamePlaceholder")}
            required
            type="text"
          />
          {fieldErrors.username ? (
            <p className="form-error" id="username-error">
              {fieldErrors.username}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="email">{t("auth.email")}</label>
          <input
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            aria-invalid={fieldErrors.email ? "true" : undefined}
            autoComplete="email"
            disabled={isSubmitting}
            id="email"
            name="email"
            placeholder={t("auth.emailPlaceholder")}
            required
            type="email"
          />
          {fieldErrors.email ? (
            <p className="form-error" id="email-error">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="password">{t("auth.password")}</label>
          <input
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            aria-invalid={fieldErrors.password ? "true" : undefined}
            autoComplete="new-password"
            disabled={isSubmitting}
            id="password"
            name="password"
            placeholder={t("auth.createPasswordPlaceholder")}
            required
            type="password"
          />
          {fieldErrors.password ? (
            <p className="form-error" id="password-error">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>
        {formError ? (
          <p className="form-error" id="register-form-error" role="alert">
            {formError}
          </p>
        ) : null}
        <button className="button button-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? t("auth.registerSubmitting") : t("auth.createAccount")}
        </button>
      </form>
    </div>
  );
}

export function RegisterForm() {
  const { locale } = useI18n();
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      await authApi.register({ email, password, username });
      router.replace(buildRegisteredLoginUrl());
    } catch (error) {
      const validationState = getRegistrationValidationState(error, locale);
      setFieldErrors(validationState.fieldErrors);
      setFormError(validationState.formError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RegisterFormView
      fieldErrors={fieldErrors}
      formError={formError}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
    />
  );
}
