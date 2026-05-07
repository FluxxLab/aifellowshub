import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Fellow's own certification scorecard (BRD §6.6). */
export async function GET(req: NextRequest) {
  return proxy(req, "/me/certification");
}
