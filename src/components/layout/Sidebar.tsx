"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Home,
  Ticket,
  Heart,
  History,
  RefreshCcw,
  Bell,
  Settings,
  ShieldCheck
} from "lucide-react";

const sidebarLinks = [
  { name: "Overview", href: "/dashboard", icon: Home },
  { name: "Archive", href: "/dashboard/tickets", icon: Ticket },
  { name: "Saved", href: "/dashboard/saved", icon: Heart },
  { name: "Exchange", href: "/dashboard/resale", icon: RefreshCcw },
  { name: "System", href: "/dashboard/settings", icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[240px] bg-background border-r border-on-background/5 py-10 px-4 flex flex-col z-40 transition-all duration-500">
      <div className="flex-1 space-y-2">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center space-x-4 px-6 py-3.5 transition-all duration-500 group relative rounded-lg italic",
                isActive 
                  ? "bg-accent/5 text-accent font-bold border border-accent/10 shadow-sm" 
                  : "text-text-muted hover:text-primary hover:bg-on-background/5"
              )}
            >
              <link.icon className={cn(
                "w-4 h-4 transition-transform duration-500 group-hover:scale-110",
                isActive ? "text-accent" : "text-text-muted/40 group-hover:text-accent"
              )} />
              <span className="text-[11px] uppercase tracking-widest font-bold">{link.name}</span>
              
              {isActive && (
                <div className="absolute left-1.5 top-4 bottom-4 w-[2px] bg-accent rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
      
      <div className="pt-8 border-t border-on-background/5 mt-auto">
        <div className="px-6 py-8 bg-surface border border-on-background/5 rounded-xl space-y-4 shadow-sm relative overflow-hidden group">
           <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest italic px-0.5 opacity-40">Society Identity</p>
           <div className="flex items-center space-x-3 text-accent-mint bg-accent-mint/5 border border-accent-mint/10 rounded-full px-4 py-2 transition-all">
             <ShieldCheck className="w-4 h-4" />
             <span className="text-[10px] font-bold tracking-widest uppercase italic">Verified</span>
           </div>
        </div>
      </div>
    </aside>
  );
};
