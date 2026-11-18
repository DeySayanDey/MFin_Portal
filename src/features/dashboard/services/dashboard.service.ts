import "server-only";

import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/errors";
import { clearAuthSession, getAccessToken } from "@/lib/auth/session";
import type { LaravelResponse } from "@/types/api";
import {
  mapDashboardAgent,
  mapDashboardBranch,
  mapDashboardFunds,
  mapDashboardKpis,
  mapDashboardLoan,
} from "../mappers/dashboard.mapper";
import {
  dashboardAgentDtoSchema,
  dashboardBranchDtoSchema,
  dashboardFundsDtoSchema,
  dashboardKpiDtoSchema,
  dashboardLoanDtoSchema,
  dashboardQuerySchema,
} from "../schemas/dashboard.schema";
import type { DashboardSnapshot } from "../types/dashboard.types";

async function withToken<T>(run: (token: string) => Promise<T>): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError({ message: "Unauthorized. Bearer token required.", status: 401, code: "UNAUTHORIZED" });
  }
  try {
    return await run(token);
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) await clearAuthSession();
    throw error;
  }
}

function validationError(error: { flatten: () => unknown; issues: { message: string }[] }): ApiError {
  return new ApiError({
    message: error.issues[0]?.message ?? "Validation failed",
    status: 422,
    code: "VALIDATION",
    details: error.flatten(),
  });
}

/** Laravel: GET /api/DashboardGet */
export async function getDashboard(input: unknown): Promise<DashboardSnapshot> {
  const parsed = dashboardQuerySchema.safeParse(input);
  if (!parsed.success) throw validationError(parsed.error);
  const query = parsed.data;

  return withToken(async (token) => {
    const payload = await api.get<LaravelResponse<unknown>>(endpoints.dashboard.get, {
      accessToken: token,
      expectEnvelope: false,
      searchParams: {
        from_date: query.fromDate,
        to_date: query.toDate,
        branch_id: query.branchId,
      },
    });
    if (!payload || payload.success !== true) {
      throw new ApiError({
        message: payload && typeof payload.message === "string" ? payload.message : "Dashboard could not be loaded",
        status: 422,
        code: "VALIDATION",
      });
    }
    const data = payload.data && typeof payload.data === "object" ? (payload.data as Record<string, unknown>) : {};
    const kpis = dashboardKpiDtoSchema.safeParse(data.kpis);
    const funds = dashboardFundsDtoSchema.safeParse(data.funds);
    if (!kpis.success || !funds.success) {
      throw new ApiError({ message: "Dashboard response was unexpected", status: 500, code: "UNEXPECTED" });
    }
    const list = (value: unknown) => (Array.isArray(value) ? value : []);
    return {
      fromDate: typeof data.from_date === "string" ? data.from_date : query.fromDate,
      toDate: typeof data.to_date === "string" ? data.to_date : query.toDate,
      branchId: typeof data.branch_id === "number" ? data.branch_id : query.branchId ?? null,
      kpis: mapDashboardKpis(kpis.data),
      funds: mapDashboardFunds(funds.data),
      agents: list(data.agents).flatMap((row) => {
        const parsed = dashboardAgentDtoSchema.safeParse(row);
        return parsed.success ? [mapDashboardAgent(parsed.data)] : [];
      }),
      branches: list(data.branches).flatMap((row) => {
        const parsed = dashboardBranchDtoSchema.safeParse(row);
        return parsed.success ? [mapDashboardBranch(parsed.data)] : [];
      }),
      loans: list(data.loans).flatMap((row) => {
        const parsed = dashboardLoanDtoSchema.safeParse(row);
        return parsed.success ? [mapDashboardLoan(parsed.data)] : [];
      }),
    };
  });
}
