import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function GET(req: NextRequest) {
  return proxy(req, "/forum/threads");
}

export async function POST(req: NextRequest) {
  return proxy(req, "/forum/threads");
}
