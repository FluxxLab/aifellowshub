import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Link from "next/link";
import { useSidebarContext } from "./sidebar-context";

// Brand colours for the navy sidebar:
//   active → PIC yellow (#fef2c5) tile + navy text — the brand
//            CTA pairing; readable on the pale cream against navy.
//   idle   → light-on-navy text (white/80)
//   hover  → subtle white/5 lift
const menuItemBaseStyles = cva(
  "rounded-lg px-3.5 font-medium transition-all duration-200 text-sm",
  {
    variants: {
      isActive: {
        true: "bg-pic-yellow text-fellowship-navy",
        false: "text-white/80 hover:bg-white/5 hover:text-white",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { toggleSidebar, isMobile, isOpen } = useSidebarContext();

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        // Close sidebar on clicking link if it's mobile
        onClick={() => isMobile && toggleSidebar()}
        className={cn(
          menuItemBaseStyles({
            isActive: props.isActive,
            className: "relative block py-1.5",
          }),
          props.className,
        )}
      >
        <div className={cn("flex items-center gap-3 w-full", !isOpen && "justify-center")}>
          {props.children}
        </div>
      </Link>
    );
  }

  return (
    <button
      onClick={props.onClick}
      aria-expanded={props.isActive}
      className={menuItemBaseStyles({
        isActive: props.isActive,
        className: "flex w-full items-center gap-3 py-2",
      })}
    >
      <div className={cn("flex items-center gap-3 w-full", !isOpen && "justify-center")}>
        {props.children}
      </div>
    </button>
  );
}
