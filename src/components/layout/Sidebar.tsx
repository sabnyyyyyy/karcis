"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Ticket, Heart, Settings, Stamp, BookOpen, MessagesSquare, Megaphone } from "lucide-react";
import { useMyPasses } from "@/lib/chain/hooks";
import { useHydrated } from "@/lib/useHydrated";
import { levelFor, totalStamps } from "@/lib/passport";

const sidebarLinks = [
  { name: "Beranda", href: "/dashboard", icon: Home },
  { name: "Paspor", href: "/dashboard/passport", icon: BookOpen },
  { name: "Komunitas", href: "/dashboard/community", icon: MessagesSquare },
  { name: "Pass & Lencana", href: "/dashboard/tickets", icon: Ticket },
  { name: "Kampanye", href: "/dashboard/campaigns", icon: Megaphone },
  { name: "Tersimpan", href: "/dashboard/saved", icon: Heart },
  { name: "Pengaturan", href: "/dashboard/settings", icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const passes = useMyPasses();
  const stamps = hydrated ? totalStamps(passes) : 0;
  const level = levelFor(stamps);

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[240px] bg-background border-r border-on-background/5 py-10 px-4 flex flex-col z-40 transition-all duration-500">
      <div className="flex-1 space-y-2">
        {sidebarLinks.map((link) => {
          const isActive = link.href === "/dashboard" ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center space-x-4 px-6 py-3.5 transition-all duration-500 group relative rounded-lg",
                isActive
                  ? "bg-accent/5 text-accent-ink font-bold border border-accent/10 shadow-sm"
                  : "text-text-muted hover:text-primary hover:bg-on-background/5"
              )}
            >
              <link.icon
                className={cn(
                  "w-4 h-4 transition-transform duration-500 group-hover:scale-110",
                  isActive ? "text-accent-ink" : "text-text-muted/40 group-hover:text-accent-ink"
                )}
              />
              <span className="text-[11px] uppercase tracking-widest font-bold">{link.name}</span>

              {isActive && <div className="absolute left-1.5 top-4 bottom-4 w-[2px] bg-accent rounded-full" />}
            </Link>
          );
        })}
      </div>

      <div className="pt-8 border-t border-on-background/5 mt-auto">
        <div className="px-6 py-6 bg-surface border border-on-background/5 rounded-xl space-y-3 shadow-sm">
          <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest opacity-60">Level paspor</p>
          <p className="font-bodoni text-xl font-black text-primary">{level.name}</p>
          <div className="flex items-center gap-2 text-accent-coral text-[10px] font-bold tracking-widest uppercase">
            <Stamp className="w-3.5 h-3.5" /> {stamps} stempel
          </div>
        </div>
      </div>
    </aside>
  );
};
