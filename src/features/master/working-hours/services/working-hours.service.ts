import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import { mapWorkingHoursDto, mapWorkingHoursUpdateToDto } from "@/features/master/working-hours/mappers/working-hours.mapper";
import {
  workingHoursDtoSchema,
  workingHoursUpdateInputSchema,
} from "@/features/master/working-hours/schemas/working-hours.schema";
import type {
  WorkingHours,
  WorkingHoursDto,
} from "@/features/master/working-hours/types/working-hours.types";

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

export async function getWorkingHours(): Promise<WorkingHours> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.get<WorkingHoursDto>(endpoints.workingHours.get, {
      accessToken: token,
      expectEnvelope: true,
    });

    if (!data) {
      throw new ApiError({
        message: "Working hours not configured",
        status: 404,
        code: "NOT_FOUND",
      });
    }

    const parsed = workingHoursDtoSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Working hours response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }

    return mapWorkingHoursDto(parsed.data);
  });
}

export async function updateWorkingHours(
  input: unknown,
): Promise<WorkingHours> {
  const validated = workingHoursUpdateInputSchema.safeParse(input);
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
    const body = mapWorkingHoursUpdateToDto(validated.data);
    const data = await api.post<WorkingHoursDto>(
      endpoints.workingHours.update,
      body,
      {
        accessToken: token,
        expectEnvelope: true,
      },
    );

    if (!data) {
      throw new ApiError({
        message: "Working hours update returned no data",
        status: 500,
        code: "UNEXPECTED",
      });
    }

    const parsed = workingHoursDtoSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Working hours response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }

    return mapWorkingHoursDto(parsed.data);
  });
}
