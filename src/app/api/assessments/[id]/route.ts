import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/assessments/${encodeURIComponent(id)}`);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/assessments/${encodeURIComponent(id)}`);
}
