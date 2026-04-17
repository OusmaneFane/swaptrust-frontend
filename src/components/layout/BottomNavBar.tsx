"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListOrdered,
  ArrowLeftRight,
  User,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const items = [
  {
    href: "/tableau-de-bord",
    label: "DoniSend",
    Icon: LayoutDashboard,
    home: true,
  },
  { href: "/mes-demandes", label: "Demandes", Icon: ListOrdered },
  { href: "/transactions", label: "Échanges", Icon: ArrowLeftRight },
  { href: "/profil", label: "Profil", Icon: User },
] as const;

export function BottomNavBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-primary/10 bg-white/95 pb-safe pt-2 shadow-nav backdrop-blur-lg lg:hidden">
      <ul className="flex justify-around px-2">
        {items.map((item) => {
          const { href, label, Icon } = item;
          const home = 'home' in item && item.home === true;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-medium",
                  active ? "text-primary" : "text-text-muted",
                )}
              >
                {home ? (
                  <Logo variant="icon-only" size="sm" className="h-5 w-5" />
                ) : (
                  <Icon className={cn("h-5 w-5", active && "text-primary")} />
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
