import type { Role } from "./users";

/**
 * Single source of truth for "where does role X land after sign-in?"
 *
 * Used by:
 *   - SignInForm (post-login redirect)
 *   - Each (role)/layout.tsx (bounce wrong-role visitors to *their*
 *     home rather than 404'ing or 403'ing them)
 *
 * Keep these in sync with the route tree under `src/app/`. Each
 * destination must be reachable from the role's own layout (or the
 * layout will redirect-loop).
 */
export function roleHome(role: Role): string {
  switch (role) {
    case "super_admin":
    case "admin":
      return "/dashboard";
    case "faculty":
      return "/faculty";
    case "mentor":
      return "/mentor";
    case "fellow":
      return "/home";
  }
}
