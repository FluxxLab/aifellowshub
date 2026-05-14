import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** POST /api/users/me/consents/data-protection — fellow accepts the
 *  Data Protection Consent. Body includes the three opt-ins
 *  (recording, comms, alumni comms) plus signature + country. */
export async function POST(req: NextRequest) {
  return proxy(req, "/users/me/consents/data-protection");
}
