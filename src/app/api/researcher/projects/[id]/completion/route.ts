import { NextResponse } from "next/server";
import { GET as completionIntegrationGET, POST as completionIntegrationPOST } from "../completion-integration/route";

// Forward legacy /completion requests to canonical Stage 5 completion-integration handler
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return completionIntegrationGET(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return completionIntegrationPOST(request, context);
}
