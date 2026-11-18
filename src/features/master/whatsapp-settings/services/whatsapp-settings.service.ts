import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapWhatsAppSettingsDto,
  mapWhatsAppSettingsUpdateToDto,
} from "@/features/master/whatsapp-settings/mappers/whatsapp-settings.mapper";
import {
  whatsAppSettingsDtoSchema,
  whatsAppSettingsUpdateInputSchema,
} from "@/features/master/whatsapp-settings/schemas/whatsapp-settings.schema";
import type {
  WhatsAppSettings,
  WhatsAppSettingsDto,
} from "@/features/master/whatsapp-settings/types/whatsapp-settings.types";

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

function parseWhatsAppSettingsData(data: unknown): WhatsAppSettings {
  const parsed = whatsAppSettingsDtoSchema.safeParse(data);
  if (!parsed.success) {
    const fields = parsed.error.issues
      .map((issue) => issue.path.join(".") || "root")
      .filter((value, index, list) => list.indexOf(value) === index)
      .join(", ");
    throw new ApiError({
      message: fields
        ? `WhatsApp settings response shape was unexpected (${fields})`
        : "WhatsApp settings response shape was unexpected",
      status: 500,
      code: "UNEXPECTED",
      details: parsed.error.flatten(),
    });
  }
  return mapWhatsAppSettingsDto(parsed.data);
}

function isUnconfigured(settings: WhatsAppSettings): boolean {
  return (
    settings.accessToken.length === 0 &&
    settings.phoneNumberId.length === 0 &&
    settings.wabaId.length === 0
  );
}

/** Laravel: GET /api/WhatsAppSettingsGet */
export async function getWhatsAppSettings(): Promise<WhatsAppSettings> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.get<WhatsAppSettingsDto>(
      endpoints.whatsAppSettings.get,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "WhatsApp settings not configured",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    const settings = parseWhatsAppSettingsData(data);
    // Empty credential row → treat as not configured so the UI shows the add form.
    if (isUnconfigured(settings)) {
      throw new ApiError({
        message: "WhatsApp settings not configured",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    return settings;
  });
}

/** Laravel: POST /api/WhatsAppSettingsUpdate */
export async function updateWhatsAppSettings(
  input: unknown,
): Promise<WhatsAppSettings> {
  const validated = whatsAppSettingsUpdateInputSchema.safeParse(input);
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
    const body = mapWhatsAppSettingsUpdateToDto(validated.data);
    const data = await api.post<WhatsAppSettingsDto>(
      endpoints.whatsAppSettings.update,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "WhatsApp settings update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    return parseWhatsAppSettingsData(data);
  });
}
