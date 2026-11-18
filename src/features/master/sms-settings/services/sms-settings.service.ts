import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapSmsSettingsDto,
  mapSmsSettingsUpdateToDto,
} from "@/features/master/sms-settings/mappers/sms-settings.mapper";
import {
  smsSettingsDtoSchema,
  smsSettingsUpdateInputSchema,
} from "@/features/master/sms-settings/schemas/sms-settings.schema";
import type {
  SmsSettings,
  SmsSettingsDto,
} from "@/features/master/sms-settings/types/sms-settings.types";

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

function parseSmsSettingsData(data: unknown): SmsSettings {
  const parsed = smsSettingsDtoSchema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError({
      message: "SMS settings response shape was unexpected",
      status: 500,
      code: "UNEXPECTED",
      details: parsed.error.flatten(),
    });
  }
  return mapSmsSettingsDto(parsed.data);
}

/** Laravel: GET /api/SmsSettingsGet */
export async function getSmsSettings(): Promise<SmsSettings> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.get<SmsSettingsDto>(endpoints.smsSettings.get, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "SMS settings not configured",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    return parseSmsSettingsData(data);
  });
}

/** Laravel: POST /api/SmsSettingsUpdate */
export async function updateSmsSettings(input: unknown): Promise<SmsSettings> {
  const validated = smsSettingsUpdateInputSchema.safeParse(input);
  if (!validated.success) {
    throw new ApiError({
      message: "Validation failed",
      status: 422,
      code: "VALIDATION",
      details: validated.error.flatten(),
    });
  }

  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const body = mapSmsSettingsUpdateToDto(validated.data);
    const data = await api.post<SmsSettingsDto>(
      endpoints.smsSettings.update,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "SMS settings update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return parseSmsSettingsData(data);
  });
}
