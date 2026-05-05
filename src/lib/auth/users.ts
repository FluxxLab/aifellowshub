/**
 * Auth — shared types + a neutral loading placeholder.
 *
 * The phase-1 mock-user dictionary (Ngozi/Sara/Adaeze/Tunde/Amara) is
 * gone — auth is real (register/login → JWT in httpOnly cookie). The
 * client `useCurrentUser` hook returns `LOADING_USER` for the brief
 * window between mount and `/api/auth/me` resolving; once the backend
 * answers, the real user replaces it. Keeping the placeholder neutral
 * (empty strings, no demo names) means nothing misleading flashes
 * during hydration.
 */

export type Role = "super_admin" | "admin" | "faculty" | "mentor" | "fellow";

export type CurrentUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string;
  /** True once the user has finished or skipped their post-login tour. */
  hasSeenTour: boolean;
  /**
   * True when the user signed in with an admin-issued temp password and
   * must rotate it before continuing. The layout uses this to redirect
   * to `/change-password` until cleared.
   */
  mustChangePassword: boolean;
};

/**
 * Neutral placeholder used by the client hook before `/api/auth/me`
 * resolves. Empty `id`/`fullName`/`email` so consumers can detect the
 * pre-hydration state by checking `user.id === ""` if they need to
 * gate UI on it. Default role is `fellow` (most-restrictive view).
 */
export const LOADING_USER: CurrentUser = {
  id: "",
  fullName: "",
  email: "",
  role: "fellow",
  avatarUrl: "/images/user/owner.jpg",
  hasSeenTour: true,
  mustChangePassword: false,
};
