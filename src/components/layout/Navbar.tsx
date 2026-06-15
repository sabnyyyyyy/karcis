"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Search, User, LogOut, Settings, Ticket, Heart, History, LayoutDashboard, Bell } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Discover", href: "/" },
  { name: "Archive", href: "/events" },
  { name: "Exchange", href: "/resale" },
  { name: "Safety", href: "/protection" },
];

export const Navbar = () => {
  const [mounted, setMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    if (connected) await disconnect();
    logout();
    setIsDropdownOpen(false);
    router.push("/");
  };

  const isAuth = mounted ? isAuthenticated : false;
  const isDashboard = pathname.startsWith("/dashboard");

  // Guests should only see "Discover"
  const visibleNavLinks = isAuth 
    ? navLinks 
    : navLinks.filter(link => link.name === "Discover");

  return (
    <header className={cn(
      "fixed top-0 w-full z-[100] h-16 glass-effect flex items-center px-6 md:px-12 justify-between transition-all duration-500",
      isDashboard ? "dark-theme" : ""
    )}>
      <div className="flex items-center gap-12 md:gap-16">
        <Link href="/">
          <h1 className="font-bodoni text-2xl font-black italic tracking-tighter text-primary uppercase hover:text-accent transition-all leading-none">SolTix</h1>
        </Link>
        <nav className="hidden lg:flex gap-8 items-center">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-[11px] font-bold uppercase tracking-widest transition-all relative pb-0.5 italic",
                pathname === link.href ? "text-accent" : "text-text-muted hover:text-primary"
              )}
            >
              {link.name}
              {pathname === link.href && (
                <motion.div layoutId="nav-underline" className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-accent rounded-full" />
              )}
            </Link>
          ))}
        </nav>
      </div>
      
      <div className="flex items-center gap-8 md:gap-10">
        <div className="relative group hidden md:block text-text-muted hover:text-accent transition-all cursor-pointer">
           <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </div>

        {isAuth ? (
          <div className="flex items-center gap-8 md:gap-10 relative" ref={dropdownRef}>
            <Link href="/dashboard/notifications" className="relative group">
              <Bell className="w-4 h-4 text-text-muted group-hover:text-accent transition-all" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent-coral rounded-full border border-background shadow-sm" />
            </Link>
            
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full border border-on-background/10 overflow-hidden bg-surface transition-all shadow-sm group-hover:border-accent">
                <img src={user?.avatar || `https://api.dicebear.com/7.x/micah/svg?seed=${user?.id}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-4 w-64 bg-surface border border-on-background/10 rounded-xl shadow-xl overflow-hidden z-[110]"
                >
                  <div className="p-6 border-b border-on-background/5 bg-on-background/5">
                    <p className="text-[9px] font-bold text-accent uppercase tracking-widest italic mb-1 opacity-60">Member Identity</p>
                    <p className="text-lg font-bold text-primary truncate italic tracking-tight">{user?.name || "Curator"}</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <DropdownItem href="/dashboard" icon={<LayoutDashboard className="w-3.5 h-3.5" />}>Overview</DropdownItem>
                    <DropdownItem href="/dashboard/tickets" icon={<Ticket className="w-3.5 h-3.5" />}>Archive</DropdownItem>
                    <DropdownItem href="/dashboard/saved" icon={<Heart className="w-3.5 h-3.5" />}>Saved</DropdownItem>
                    <div className="h-[1px] bg-on-background/5 my-2 mx-2" />
                    <DropdownItem href="/dashboard/settings" icon={<Settings className="w-3.5 h-3.5" />}>Settings</DropdownItem>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-accent-coral hover:bg-accent-coral/5 transition-all italic rounded-lg"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Logout Society
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setVisible(true)}
              className="text-[10px] font-bold uppercase tracking-widest text-accent/80 hover:text-accent transition-all italic hidden md:block"
            >
              Sync Wallet
            </button>
            <div className="flex items-center border border-on-background/10 rounded-full p-0.5 shadow-sm">
              <Link href="/auth/login">
                <button className="px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-primary transition-all italic">Login</button>
              </Link>
              <Link href="/auth/register">
                <button className="px-6 py-2.5 bg-accent text-on-primary rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-accent-deep-teal transition-all italic shadow-md">Join</button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const DropdownItem = ({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <Link 
    href={href}
    className="flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-accent hover:bg-accent/5 transition-all italic rounded-lg group"
  >
    <span className="group-hover:scale-105 transition-transform duration-300">{icon}</span>
    {children}
  </Link>
);
