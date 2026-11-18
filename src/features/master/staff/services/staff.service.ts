import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import {
  mapDesignationDto,
  mapPaginationMetaDto,
  mapStaffCreateToDto,
  mapStaffDto,
  mapStaffMutationResult,
  mapStaffUpdateToDto,
} from "@/features/master/staff/mappers/staff.mapper";
import {
  designationDtoSchema,
  paginationMetaDtoSchema,
  staffCreateInputSchema,
  staffDtoSchema,
  staffMutationResultSchema,
  staffUpdateInputSchema,
} from "@/features/master/staff/schemas/staff.schema";
import type {
  StaffDto,
  StaffListQuery,
  StaffListResult,
  StaffLookups,
  StaffMutationResult,
} from "@/features/master/staff/types/staff.types";
import type { LaravelResponse } from "@/types/api";
import { z } from "zod";

const fieldStatusInputSchema = z.object({ staffId: z.number().int().positive(), isFieldStaff: z.boolean() });
const moduleSchema = z.object({ module_id: z.number().int().positive(), module_key: z.string(), module_name: z.string() });
const moduleSaveSchema = z.object({ staffId: z.number().int().positive(), moduleIds: z.array(z.number().int().positive()).max(35).refine((ids) => new Set(ids).size === ids.length) });

export async function getStaffModules(staffId: number) {
  if (!Number.isSafeInteger(staffId) || staffId < 1) throw new ApiError({ message: "Invalid staff ID", status: 422, code: "VALIDATION" });
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const [available, assigned] = await Promise.all([
      api.get<unknown>(endpoints.staff.moduleAccessList, { accessToken: token, expectEnvelope: true }),
      api.get<unknown>(endpoints.staff.staffModuleList, { accessToken: token, expectEnvelope: true, searchParams: { staff_id: staffId } }),
    ]);
    const availableResult = z.array(moduleSchema).safeParse(available);
    const assignedResult = z.array(moduleSchema).safeParse(assigned);
    if (!availableResult.success || !assignedResult.success) throw new ApiError({ message: "Staff module response shape was unexpected", status: 500, code: "UNEXPECTED" });
    const availableIds = new Set(availableResult.data.map((module) => module.module_id));
    if (availableIds.size !== availableResult.data.length || assignedResult.data.some((module) => !availableIds.has(module.module_id)) || new Set(assignedResult.data.map((module) => module.module_id)).size !== assignedResult.data.length) throw new ApiError({ message: "Staff module assignments could not be reconciled with the available catalog", status: 500, code: "UNEXPECTED" });
    const map = (item: z.infer<typeof moduleSchema>) => ({ moduleId: item.module_id, moduleKey: item.module_key, moduleName: item.module_name });
    return { available: availableResult.data.map(map), assigned: assignedResult.data.map(map) };
  });
}

export async function saveStaffModules(input: unknown) {
  const parsed = moduleSaveSchema.safeParse(input);
  if (!parsed.success) throw new ApiError({ message: "Validation failed", status: 422, code: "VALIDATION", details: parsed.error.flatten() });
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(endpoints.staff.staffModuleSave, { staff_id: parsed.data.staffId, module_ids: parsed.data.moduleIds }, { accessToken: token, expectEnvelope: true });
    const result = z.object({ staff_id: z.number().int().positive(), module_ids: z.array(z.number().int().positive()).max(35) }).safeParse(data);
    if (!result.success || result.data.staff_id !== parsed.data.staffId || result.data.module_ids.length !== parsed.data.moduleIds.length || new Set(result.data.module_ids).size !== parsed.data.moduleIds.length || result.data.module_ids.some((id) => !parsed.data.moduleIds.includes(id))) throw new ApiError({ message: "Staff module save response shape was unexpected", status: 500, code: "UNEXPECTED" });
    return { staffId: result.data.staff_id, moduleIds: result.data.module_ids };
  });
}
const fieldStatusResultSchema = z.object({ staff_id: z.number().int().positive(), is_field_staff: z.union([z.literal(0), z.literal(1)]) });

export async function setStaffFieldStatus(input: unknown) {
  const parsed = fieldStatusInputSchema.safeParse(input);
  if (!parsed.success) throw new ApiError({ message: "Validation failed", status: 422, code: "VALIDATION", details: parsed.error.flatten() });
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const data = await api.post<unknown>(endpoints.staff.fieldStatus, { staff_id: parsed.data.staffId, is_field_staff: parsed.data.isFieldStaff ? 1 : 0 }, { accessToken: token, expectEnvelope: true });
    const result = fieldStatusResultSchema.safeParse(data);
    if (!result.success || result.data.staff_id !== parsed.data.staffId || Boolean(result.data.is_field_staff) !== parsed.data.isFieldStaff) throw new ApiError({ message: "Staff field status response shape was unexpected", status: 500, code: "UNEXPECTED" });
    return { staffId: result.data.staff_id, isFieldStaff: result.data.is_field_staff === 1 };
  });
}

/** Documented aliases: `keyword` / `search`. */
export const STAFF_SEARCH_PARAM = "keyword" as const;

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

export async function listStaff(
  query: StaffListQuery = {},
): Promise<StaffListResult> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();
    const payload = await api.get<LaravelResponse<StaffDto[]>>(
      endpoints.staff.list,
      {
        accessToken: token,
        expectEnvelope: false,
        searchParams: {
          page: query.page ?? 1,
          per_page: query.perPage ?? 20,
          staff_id: query.staffId,
          branch_id: query.branchId,
          designation_id: query.designationId,
          [STAFF_SEARCH_PARAM]: query.keyword,
          status: query.status,
          is_field_staff: query.isFieldStaff,
          include_modules: query.includeModules ? 1 : undefined,
        },
      },
    );

    if (
      !payload ||
      typeof payload !== "object" ||
      !("success" in payload) ||
      payload.success !== true
    ) {
      const message =
        payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : "Failed to load staff";
      throw new ApiError({
        message,
        status: 500,
        code: "UNEXPECTED",
        details: payload,
      });
    }

    const rows = Array.isArray(payload.data) ? payload.data : [];
    const items = rows.flatMap((row) => {
      const parsed = staffDtoSchema.safeParse(row);
      return parsed.success ? [mapStaffDto(parsed.data)] : [];
    });

    let meta: StaffListResult["meta"] = null;
    if (payload.meta) {
      const metaParsed = paginationMetaDtoSchema.safeParse(payload.meta);
      if (metaParsed.success) {
        meta = mapPaginationMetaDto(metaParsed.data);
      }
    }

    return { items, meta };
  });
}

export async function createStaff(
  input: unknown,
): Promise<StaffMutationResult> {
  const validated = staffCreateInputSchema.safeParse(input);
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
    const body = mapStaffCreateToDto(validated.data);
    const data = await api.post<{
      staff_id: number;
      employee_code?: string | null;
      user_id?: number | null;
      user_name?: string | null;
    }>(endpoints.staff.add, body, {
      accessToken: token,
      expectEnvelope: true,
    });
    const parsed = staffMutationResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Staff create response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }
    return mapStaffMutationResult(parsed.data);
  });
}

export async function updateStaff(
  input: unknown,
): Promise<StaffMutationResult> {
  const validated = staffUpdateInputSchema.safeParse(input);
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
    const body = mapStaffUpdateToDto(validated.data);
    const data = await api.post<{
      staff_id: number;
      employee_code?: string | null;
      user_id?: number | null;
      user_name?: string | null;
    }>(endpoints.staff.edit, body, {
      accessToken: token,
      expectEnvelope: true,
    });
    const parsed = staffMutationResultSchema.safeParse(data);
    if (!parsed.success) {
      throw new ApiError({
        message: "Staff update response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
        details: parsed.error.flatten(),
      });
    }
    return mapStaffMutationResult(parsed.data);
  });
}

export async function getStaffLookups(): Promise<StaffLookups> {
  return withUnauthorizedClear(async () => {
    const token = await requireAccessToken();

    const designationPayload = await api.get<LaravelResponse<unknown[]>>(
      endpoints.staff.designationList,
      { accessToken: token, expectEnvelope: false },
    );
    if (!designationPayload?.success || !Array.isArray(designationPayload.data)) {
      throw new ApiError({
        message: "Designation response shape was unexpected",
        status: 500,
        code: "UNEXPECTED",
      });
    }
    const designations = designationPayload.data.map((row) => {
      const parsed = designationDtoSchema.safeParse(row);
      if (!parsed.success) {
        throw new ApiError({
          message: "Designation response shape was unexpected",
          status: 500,
          code: "UNEXPECTED",
          details: parsed.error.flatten(),
        });
      }
      return mapDesignationDto(parsed.data);
    });

    return { designations, modules: [] };
  });
}
