import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function GET(req: NextRequest) {
  return proxy(req, "/me/capstone");
}

export async function PATCH(req: NextRequest) {
  return proxy(req, "/me/capstone");
}
