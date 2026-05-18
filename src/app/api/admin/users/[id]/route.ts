import { NextRequest } from "next/server";
import { proxy } from "@/lib/api/proxy";

/** Generic user profile (works for any role). Used by the
 *  /participants/:id page for non-fellow roles. */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/users/${encodeURIComponent(id)}`);
}

/** Admin edit of any non-fellow profile (mentor / faculty / admin).
 *  Forwards to the same path on the backend, which enforces the
 *  admin/super_admin role and the no-self-demote / no-self-deactivate
 *  guards. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/users/${encodeURIComponent(id)}`);
}

/** Hard-delete (super_admin only). Backend guards: no self-delete,
 *  no super_admin delete, no delete with hosted sessions / owned courses. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  return proxy(req, `/admin/users/${encodeURIComponent(id)}`);
}
