import { z } from "zod";

/**
 * Public (browser-safe) environment variables only.
 * Never put secrets or AUTH_SESSION_SECRET in NEXT_PUBLIC_*.
 */
const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .trim()
    .min(1, "NEXT_PUBLIC_API_BASE_URL is required")
    .url("NEXT_PUBLIC_API_BASE_URL must be a valid URL"),
  NEXT_PUBLIC_APP_ENV: z.enum(["development", "test", "production"]),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

function readPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  });

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid public environment configuration. ${details}`);
  }

  return parsed.data;
}

/** Validated public env. Safe to import from Client and Server Components. */
export const env: PublicEnv = readPublicEnv();

export function isProductionEnv(): boolean {
  return env.NEXT_PUBLIC_APP_ENV === "production";
}

/**
 * Server-only session sealing secret.
 * Readable in Route Handlers, Server Components, and Edge middleware.
 * Never expose via NEXT_PUBLIC_*.
 */
export function getAuthSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SESSION_SECRET is required and must be at least 32 characters. Do not use NEXT_PUBLIC_* for this value.",
    );
  }
  return secret;
}
