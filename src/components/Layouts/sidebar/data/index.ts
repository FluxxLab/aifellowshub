/**
 * Role-aware navigation data for the new Layouts/sidebar.
 *
 * Shape matches the upstream NextAdmin reference: each entry is a
 * section with a label and items; each item can have nested items
 * (rendered as an expanding sub-tree). Icons are React components
 * (FC<SVGProps>), not JSX elements — the sidebar renders them as
 * `<item.icon ... />`.
 *
 * Returned by `getNavData(role)` rather than exposed as a static
 * constant so the same module can drive admin, fellow, mentor, and
 * faculty experiences.
 */
import type { Role } from "@/lib/auth/users";
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
} from "@/icons";

type SvgComponent = React.FC<React.SVGProps<SVGSVGElement>>;

export type NavSubItem = { title: string; url: string };
export type NavItem = {
  title: string;
  icon: SvgComponent;
  url?: string;
  items: NavSubItem[];
};
export type NavSection = { label: string; items: NavItem[] };

const ADMIN_NAV: NavSection[] = [
  {
    label: "MAIN",
    items: [
      { title: "Dashboard", icon: GridIcon as SvgComponent, url: "/dashboard", items: [] },
      { title: "Participants", icon: UsersRoundIcon as SvgComponent, url: "/participants", items: [] },
    ],
  },
  {
    label: "PROGRAMME",
    items: [
      {
        title: "Programme",
        icon: BoxCubeIcon as SvgComponent,
        items: [
          { title: "Courses", url: "/courses" },
          { title: "Sessions", url: "/sessions" },
        ],
      },
      { title: "Assessments", icon: FileIcon as SvgComponent, url: "/assessments", items: [] },
      { title: "Library", icon: FolderIcon as SvgComponent, url: "/resources", items: [] },
      { title: "Module reviews", icon: CheckLineIcon as SvgComponent, url: "/module-reviews", items: [] },
      { title: "Coaching bookings", icon: BoltIcon as SvgComponent, url: "/mentorship-bookings", items: [] },
      { title: "Capstone", icon: ShootingStarIcon as SvgComponent, url: "/capstone", items: [] },
      { title: "Certificates", icon: CheckCircleIcon as SvgComponent, url: "/certificates", items: [] },
      { title: "Forum groups", icon: ChatIcon as SvgComponent, url: "/forum-groups", items: [] },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { title: "Analytics", icon: PieChartIcon as SvgComponent, url: "/analytics", items: [] },
      { title: "Settings", icon: PlugInIcon as SvgComponent, url: "/settings", items: [] },
      { title: "Audit log", icon: ListIcon as SvgComponent, url: "/audit-log", items: [] },
    ],
  },
];

const FELLOW_NAV: NavSection[] = [
  {
    label: "LEARN",
    items: [
      { title: "Home", icon: GridIcon as SvgComponent, url: "/home", items: [] },
      {
        title: "Programme",
        icon: BoxCubeIcon as SvgComponent,
        items: [
          { title: "Modules", url: "/learning" },
          { title: "Sessions", url: "/my-sessions" },
          { title: "Assessments", url: "/my-assessments" },
          { title: "Library", url: "/library" },
        ],
      },
      { title: "AI Buddy", icon: BoltIcon as SvgComponent, url: "/ai-buddy", items: [] },
    ],
  },
  {
    label: "ME",
    items: [
      { title: "Capstone", icon: ShootingStarIcon as SvgComponent, url: "/my-capstone", items: [] },
      {
        title: "Mentors",
        icon: UsersRoundIcon as SvgComponent,
        items: [
          { title: "Find a mentor", url: "/mentors" },
          { title: "My bookings", url: "/my-bookings" },
        ],
      },
      { title: "Forum", icon: ChatIcon as SvgComponent, url: "/forum", items: [] },
      { title: "Certificate", icon: CheckCircleIcon as SvgComponent, url: "/my-certificates", items: [] },
    ],
  },
];

const MENTOR_NAV: NavSection[] = [
  {
    label: "MENTOR",
    items: [
      { title: "Home", icon: GridIcon as SvgComponent, url: "/mentor", items: [] },
      { title: "Queue", icon: ShootingStarIcon as SvgComponent, url: "/mentor/queue", items: [] },
      { title: "Coaching", icon: ChatIcon as SvgComponent, url: "/mentor/requests", items: [] },
      { title: "Grading", icon: CheckCircleIcon as SvgComponent, url: "/mentor/grading", items: [] },
    ],
  },
];

const FACULTY_NAV: NavSection[] = [
  {
    label: "FACULTY",
    items: [
      { title: "Home", icon: GridIcon as SvgComponent, url: "/faculty", items: [] },
      { title: "My modules", icon: BoxCubeIcon as SvgComponent, url: "/faculty/modules", items: [] },
      { title: "Grading", icon: CheckCircleIcon as SvgComponent, url: "/faculty/grading", items: [] },
    ],
  },
];

export function getNavData(role: Role | undefined): NavSection[] {
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
    default:
      return ADMIN_NAV;
  }
}

/** Path-based fallback for the brief window before role hydrates. */
export function getNavDataForPath(pathname: string): NavSection[] {
  if (pathname.startsWith("/faculty")) return FACULTY_NAV;
  if (pathname.startsWith("/mentor")) return MENTOR_NAV;
  if (
    pathname.startsWith("/home") ||
    pathname.startsWith("/learning") ||
    pathname.startsWith("/my-") ||
    pathname.startsWith("/ai-buddy") ||
    pathname.startsWith("/forum") ||
    pathname.startsWith("/library")
  ) {
    return FELLOW_NAV;
  }
  return ADMIN_NAV;
}

/** Legacy export kept so any old imports still resolve at compile time. */
export const NAV_DATA: NavSection[] = ADMIN_NAV;
