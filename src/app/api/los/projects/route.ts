import { NextResponse } from "next/server";
import {
  addLoanApplicationProject,
  editLoanApplicationProject,
  listLoanApplicationProjects,
} from "@/features/los/services/los.service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const applicationId = Number(searchParams.get("application_id"));
    if (!Number.isFinite(applicationId) || applicationId <= 0) {
      return NextResponse.json(
        { success: false, message: "application_id is required", data: [] },
        { status: 422 },
      );
    }
    const projects = await listLoanApplicationProjects(applicationId);
    return NextResponse.json({
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSessionUser();
    const body = (await request.json()) as Record<string, unknown>;
    const action = body.action;
    delete body.action;

    if (action === "edit" || typeof body.project_id === "number") {
      const item = await editLoanApplicationProject(body as any);
      return NextResponse.json({
        success: true,
        message: "Project updated successfully",
        data: item,
      });
    }

    const item = await addLoanApplicationProject(body as any);
    return NextResponse.json(
      {
        success: true,
        message: "Project added successfully",
        data: item,
      },
      { status: 201 },
    );
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
