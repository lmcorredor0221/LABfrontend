import type { LoginCredentials } from "@/core/auth/types";

export type LoginValidationErrors = Partial<Record<keyof LoginCredentials, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginCredentials(values: LoginCredentials): LoginValidationErrors {
  const errors: LoginValidationErrors = {};
  const email = values.email.trim();
  const password = values.password.trim();

  if (!email) {
    errors.email = "Ingresa tu correo electronico.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Ingresa un correo valido.";
  }

  if (!password) {
    errors.password = "Ingresa tu contrasena.";
  }

  return errors;
}
