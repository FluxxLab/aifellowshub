import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Short-lived link to the signed-in fellow's capstone document. */
export async function GET(req: NextRequest) {
  return proxy(req, "/me/capstone/download-url");
}
