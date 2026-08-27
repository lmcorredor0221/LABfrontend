function readSeededCredential(envValue: string | undefined, fallback: string) {
  const trimmed = envValue?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export const SEEDED_LOCAL_ADMIN_EMAIL = readSeededCredential(
  process.env.NEXT_PUBLIC_LOCAL_ADMIN_EMAIL,
  "admin@leanbuilder.local",
);

export const SEEDED_LOCAL_ADMIN_PASSWORD = readSeededCredential(
  process.env.NEXT_PUBLIC_LOCAL_ADMIN_PASSWORD,
  "LeanBuilder123!",
);
