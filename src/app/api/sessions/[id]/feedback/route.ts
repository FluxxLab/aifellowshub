import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Fellow's feedback for a specific session — GET (own submission) + POST (submit). */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/me/sessions/${encodeURIComponent(id)}/feedback`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/me/sessions/${encodeURIComponent(id)}/feedback`);
}
