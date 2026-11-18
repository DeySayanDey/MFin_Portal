import { handleChargesGet, handleChargesPost } from "@/features/master/charges-setup/services/charges-setup.bff";

export function GET(request: Request) {
  return handleChargesGet("loan", request);
}

export function POST(request: Request) {
  return handleChargesPost("loan", request);
}
