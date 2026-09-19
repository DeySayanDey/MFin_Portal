import { NextResponse } from "next/server";
import { fetchMenuTree } from "@/features/navigation/services/menu-service";
import { toBffErrorResponse } from "@/lib/api/bff-response";
import { requireSessionUser } from "@/lib/auth/bff-scope";

export async function GET(request: Request) {
  try {
    await requireSessionUser();
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    // Never accept client-supplied role_id — Laravel derives access from the token.

    const menu = await fetchMenuTree({
      status: statusParam ? Number(statusParam) : 1,
    });

    return NextResponse.json({
      success: true,
      message: "Menu tree retrieved successfully",
      data: menu,
    });
  } catch (error) {
    return toBffErrorResponse(error);
  }
}
