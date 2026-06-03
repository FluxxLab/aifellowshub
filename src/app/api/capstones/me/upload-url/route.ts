import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function POST(req: NextRequest) {
  return proxy(req, "/me/capstone/upload-url");
}
