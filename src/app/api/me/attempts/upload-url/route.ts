/**
 * POST /api/me/attempts/upload-url
 *
 * Fellow-only — mints a presigned PUT URL for an assessment-answer
 * attachment. Used BEFORE submission: the fellow picks a file in the
 * AssessmentTaker, the file uploads directly to a scratch location
 * (`attempts/scratch/{fellowId}/...`) keyed to their user, and the
 * resulting public URL is held in the local form state until submit.
 *
 * On submit (`POST /api/modules/:id/submit`), the attachment answer
 * body carries the URL + filename + size + MIME, and the backend
 * persists those on the newly-created answer row.
 *
 * Why scratch (vs uploading at submit time): a 25 MB file would
 * block the submit POST for 5-30 seconds while bytes streamed.
 * Uploading per-question as the fellow picks the file lets them
 * keep typing other answers in parallel — submit is then a tiny
 * JSON POST.
 *
 * Stale scratch uploads (never claimed because the fellow abandoned
 * the attempt) are cleaned up by a backend cron — see the handoff.
 */
import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

export async function POST(req: NextRequest) {
  return proxy(req, "/me/attempts/upload-url");
}
