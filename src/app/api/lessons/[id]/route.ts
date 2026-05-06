import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/lessons/${encodeURIComponent(id)}`);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/lessons/${encodeURIComponent(id)}`);
}
