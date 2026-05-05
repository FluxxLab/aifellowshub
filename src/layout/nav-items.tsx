import type { ReactNode } from "react";
import {
  BoltIcon,
  BoxCubeIcon,
  ChatIcon,
  CheckCircleIcon,
  CheckLineIcon,
  FileIcon,
  FolderIcon,
  GridIcon,
  ListIcon,
  PieChartIcon,
  PlugInIcon,
  ShootingStarIcon,
  UsersRoundIcon,
} from "../icons/index";
import type { Role } from "@/lib/auth/users";

/**
 * Single source of truth for navigation. Imported by both `AppSidebar`
 * (primary chrome) and any future surfaces that need to render the
 * same set of role-aware links.
 *
 * Keep these in sync with the route tree under `src/app/`. Sub-items
 * are rendered inline-expanded in the sidebar full-width state and
 * as flyout tooltips when collapsed to icons.
 */

export type SubItem = { name: string; path: string };
export type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: SubItem[];
  /** Optional group label. Renderer draws a divider (and a label in
   *  the expanded sidebar) before the first item of each new group. */
  section?: string;
};

export const ADMIN_NAV: NavItem[] = [
  // Three groups, two dividers — fewer cuts read calmer in the
  // 64px collapsed rail and still give a clear top/middle/bottom
  // shape: daily overview surfaces, programme content surfaces,
  // operator surfaces.
  //
  // Main — highest-frequency surfaces opened daily.
  { section: "Main", icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
  { icon: <UsersRoundIcon />, name: "Participants", path: "/participants" },

  // Programme — everything content-related, including capstone &
  // certificates which used to live in a separate "Outputs" group
  // (they're still programme content, just at the end of the journey).
  {
    section: "Programme",
    icon: <BoxCubeIcon />,
    name: "Programme",
    subItems: [
      { name: "Courses", path: "/courses" },
      { name: "Sessions", path: "/sessions" },
    ],
  },
  { icon: <FileIcon />, name: "Assessments", path: "/assessments" },
  { icon: <FolderIcon />, name: "Library", path: "/resources" },
  { icon: <CheckLineIcon />, name: "Module reviews", path: "/module-reviews" },
  { icon: <ShootingStarIcon />, name: "Capstone", path: "/capstone" },
  { icon: <CheckCircleIcon />, name: "Certificates", path: "/certificates" },

  // System — operator / less-frequent surfaces. Analytics belongs
  // here because admins consult it weekly, not daily, like the
  // settings + audit log pages it neighbours.
  { section: "System", icon: <PieChartIcon />, name: "Analytics", path: "/analytics" },
  { icon: <PlugInIcon />, name: "Settings", path: "/settings" },
  { icon: <ListIcon />, name: "Audit log", path: "/audit-log" },
];

export const FELLOW_NAV: NavItem[] = [
  { icon: <GridIcon />, name: "Home", path: "/home" },
  {
    icon: <BoxCubeIcon />,
    name: "Programme",
    subItems: [
      { name: "Modules", path: "/learning" },
      { name: "Sessions", path: "/my-sessions" },
      { name: "Library", path: "/library" },
    ],
  },
  { icon: <BoltIcon />, name: "AI Buddy", path: "/ai-buddy" },
  { icon: <ShootingStarIcon />, name: "Capstone", path: "/my-capstone" },
  { icon: <ChatIcon />, name: "Forum", path: "/forum" },
  { icon: <CheckCircleIcon />, name: "Certificate", path: "/my-certificates" },
];

export const MENTOR_NAV: NavItem[] = [
  { icon: <GridIcon />, name: "Home", path: "/mentor" },
  { icon: <ShootingStarIcon />, name: "Queue", path: "/mentor/queue" },
  { icon: <CheckCircleIcon />, name: "Grading", path: "/mentor/grading" },
];

export const FACULTY_NAV: NavItem[] = [
  { icon: <GridIcon />, name: "Home", path: "/faculty" },
  { icon: <BoxCubeIcon />, name: "My modules", path: "/faculty/modules" },
  { icon: <CheckCircleIcon />, name: "Grading", path: "/faculty/grading" },
];

const FELLOW_PATH_PREFIXES = [
  "/home",
  "/learning",
  "/my-sessions",
  "/ai-buddy",
  "/forum",
  "/library",
  "/my-capstone",
  "/my-certificates",
  "/my-profile",
  "/attempts",
];

const MENTOR_PATH_PREFIX = "/mentor";
const FACULTY_PATH_PREFIX = "/faculty";

export function pickNavForRole(role: Role): NavItem[] {
  switch (role) {
    case "fellow":
      return FELLOW_NAV;
    case "mentor":
      return MENTOR_NAV;
    case "faculty":
      return FACULTY_NAV;
    case "admin":
    case "super_admin":
      return ADMIN_NAV;
  }
}

/** Fallback when the user role isn't yet hydrated (pre-mount window). */
export function pickNavForPath(pathname: string): NavItem[] {
  if (pathname.startsWith(FACULTY_PATH_PREFIX)) return FACULTY_NAV;
  if (pathname.startsWith(MENTOR_PATH_PREFIX)) return MENTOR_NAV;
  if (FELLOW_PATH_PREFIXES.some((p) => pathname.startsWith(p)))
    return FELLOW_NAV;
  return ADMIN_NAV;
}
