import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapGlobalSettings,
  mapGlobalSettingsUpdateToDto,
} from "@/features/master/global-settings/mappers/global-settings.mapper";
import {
  globalSettingsDtoSchema,
  globalSettingsUpdateInputSchema,
} from "@/features/master/global-settings/schemas/global-settings.schema";
import type {
  GlobalSettingsDto,
  GlobalSettingsView,
} from "@/features/master/global-settings/types/global-settings.types";
import {
  getSecurityPolicy,
  updateSecurityPolicy,
} from "@/features/security/login-settings/services/login-settings.service";
import type { LoginSecurityDraft } from "@/features/security/login-settings/types/login-settings.types";

async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError({
      message: "Unauthorized. Bearer token required.",
      status: 401,
      code: "UNAUTHORIZED",
    });
  }
  return token;
}

async function withUnauthorizedClear<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) {
      await clearAuthSession();
    }
    throw error;
  }
}

function parseDto(data: unknown) {
  if (data == null) return null;
  const parsed = globalSettingsDtoSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError({
      message: "Global settings response shape was unexpected",
      status: 500,
      code: "UNEXPECTED",
      details: parsed.error.flatten(),
    });
  }
  return parsed.data;
}

/** Laravel: GET /api/GlobalSettingsGet + GET /api/SecurityPolicyGet */
export async function getGlobalSettings(): Promise<GlobalSettingsView> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const [data, policy] = await Promise.all([
      api.get<GlobalSettingsDto | null>(endpoints.globalSettings.get, {
        accessToken: token,
        expectEnvelope: true,
      }),
      getSecurityPolicy(),
    ]);
    const dto = parseDto(data);
    return {
      ...mapGlobalSettings(dto, policy),
      configured: dto != null,
      updatedByName: dto?.updated_by_name ?? null,
      updatedAt: dto?.updated_at ?? null,
    };
  });
}

/** Laravel: POST /api/GlobalSettingsUpdate, then POST /api/SecurityPolicyUpdate for the two security fields. */
export async function updateGlobalSettings(input: unknown): Promise<GlobalSettingsView> {
  const validated = globalSettingsUpdateInputSchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: validated.error.flatten(),
    });
  }
  const settings = validated.data;

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<GlobalSettingsDto>(
      endpoints.globalSettings.update,
      mapGlobalSettingsUpdateToDto(settings),
      { accessToken: token, expectEnvelope: true },
    );

    const current = await getSecurityPolicy();
    const expiryOn = settings.passwordExpiryDays > 0;
    const securityChanged =
      current.maxAttempts !== settings.loginAttemptLimit ||
      current.expirationEnabled !== expiryOn ||
      (expiryOn && current.expirationDays !== settings.passwordExpiryDays);

    let policy = current;
    if (securityChanged) {
      const { id: _id, ...draft } = current;
      const next: LoginSecurityDraft = {
        ...draft,
        maxAttempts: settings.loginAttemptLimit,
        expirationEnabled: expiryOn,
        expirationDays: expiryOn ? settings.passwordExpiryDays : current.expirationDays,
      };
      policy = await updateSecurityPolicy(next);
    }

    const dto = parseDto(data);
    return {
      ...mapGlobalSettings(dto, policy),
      configured: true,
      updatedByName: dto?.updated_by_name ?? null,
      updatedAt: dto?.updated_at ?? null,
    };
  });
}
