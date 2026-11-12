"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, Settings, Ticket, LayoutDashboard, ArrowUpRight, Building2, User as UserIcon } from "lucide-react";
import { useAuthStore, useProfile } from "@/store/useAuthStore";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useHydrated } from "@/lib/useHydrated";
import { motion, AnimatePresence } from "framer-motion";

// Menu landing (anchor ke section)
const landingLinks = [
  { name: "About", href: "/#about" },
  { name: "Features", href: "/#services" },
  { name: "Events", href: "/#events" },
  { name: "Contact", href: "/#contact" },
];

// Menu halaman lain
const appLinks = [
  { name: "Home", href: "/" },
  { name: "Events", href: "/events" },
  { name: "Ticket Market", href: "/resale" },
  { name: "How It Works", href: "/how-it-works" },
];

const shortAccount = (id: string) => (id.length > 22 ? `${id.slice(0, 10)}…${id.slice(-8)}` : id);

export const Navbar = () => {
  const hydrated = useHydrated();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [onDark, setOnDark] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { accountId, signIn, signOut } = useNearWallet();
  const profile = useProfile();
  const setActiveRole = useAuthStore((s) => s.setActiveRole);

  const isLanding = pathname === "/";
  const links = isLanding ? landingLinks : appLinks;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Navbar ganti gelap/terang mengikuti section yang ada di bawahnya.
  // Section menandai diri dengan data-nav-theme; tanpa tanda, landing = gelap, halaman lain = terang.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const els = document.elementsFromPoint(window.innerWidth / 2, 36);
      const themed = els.map((e) => e.closest("[data-nav-theme]")).find((e): e is Element => !!e);
      setOnDark(themed ? themed.getAttribute("data-nav-theme") === "dark" : isLanding);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isLanding, pathname]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut();
    router.push("/");
  };

  const connected = hydrated && !!accountId;
  const hasProfile = connected && !!profile;
  const isOrganizer = profile?.activeRole === "organizer";

  return (
    <header className="fixed top-3 md:top-4 inset-x-0 z-[100] px-3 md:px-6 pointer-events-none">
      {/* bar melayang berujung bulat (pill): tidak lagi selebar layar */}
      <div
        className={cn(
          "pointer-events-auto relative mx-auto max-w-[1180px] h-14 md:h-[60px] flex items-center justify-between rounded-full border pl-6 pr-2 md:pl-8 md:pr-2.5 backdrop-blur-xl shadow-[0_12px_40px_-18px_rgba(0,0,0,0.55)] transition-colors duration-500",
          onDark ? "bg-black/45 border-white/12 text-white" : "bg-white/75 border-[#141414]/10 text-[#141414]"
        )}
      >
      <Link href="/" aria-label="Karcis">
        <span
          className={cn(
            "font-[family-name:var(--font-logo)] text-2xl font-black italic tracking-tighter uppercase transition-colors leading-none",
            onDark ? "text-[#9CFF1E]" : "text-[#141414] hover:text-[#3F7D00]"
          )}
        >
          Karcis
        </span>
      </Link>

      <nav className="hidden md:flex gap-8 items-center absolute left-1/2 -translate-x-1/2">
        {links.map((link) => {
          const active = !isLanding && (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href));
          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-[15px] font-medium transition-opacity relative",
                active ? "opacity-100" : "opacity-80 hover:opacity-100"
              )}
            >
              {link.name}
              {active && <span className="absolute -bottom-1.5 left-0 right-0 h-[2px] rounded-full bg-[#9CFF1E]" />}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-4 md:gap-6" ref={dropdownRef}>
        {hasProfile ? (
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen((v) => !v)}
              className={cn(
                "flex items-center gap-3 pl-1.5 pr-5 py-1.5 rounded-full border text-[13px] font-medium transition-all",
                onDark ? "border-[#9CFF1E] text-[#9CFF1E]" : "border-[#9CFF1E] text-[#141414] hover:bg-[#9CFF1E]"
              )}
            >
              <span className="w-8 h-8 rounded-full bg-[#9CFF1E] text-[#141414] flex items-center justify-center text-sm font-bold uppercase">
                {profile?.name?.[0] ?? "K"}
              </span>
              <span className="hidden sm:inline max-w-[140px] truncate">{profile?.name}</span>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-4 w-72 bg-white text-[#141414] border border-black/10 rounded-2xl shadow-xl overflow-hidden z-[110]"
                >
                  <div className="p-5 border-b border-black/5 bg-[#F5F8EE] space-y-1">
                    <p className="text-lg font-semibold truncate">{profile?.name}</p>
                    <p className="text-[11px] font-mono text-[#5C6157] truncate" title={accountId ?? ""}>
                      {accountId ? shortAccount(accountId) : ""}
                    </p>
                  </div>

                  {profile && profile.roles.length > 1 && (
                    <div className="p-3 border-b border-black/5 grid grid-cols-2 gap-2">
                      {(["buyer", "organizer"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            if (accountId) setActiveRole(accountId, r);
                            setIsDropdownOpen(false);
                            router.push(r === "organizer" ? "/organizer" : "/dashboard");
                          }}
                          className={cn(
                            "flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all",
                            profile.activeRole === r ? "bg-[#9CFF1E] text-[#141414]" : "bg-black/5 hover:bg-black/10"
                          )}
                        >
                          {r === "buyer" ? <UserIcon className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                          {r === "buyer" ? "Buyer" : "Organizer"}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="p-2 space-y-0.5">
                    {isOrganizer ? (
                      <DropdownItem href="/organizer" icon={<Building2 className="w-4 h-4" />}>Organizer dashboard</DropdownItem>
                    ) : (
                      <>
                        <DropdownItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />}>My passport</DropdownItem>
                        <DropdownItem href="/dashboard/tickets" icon={<Ticket className="w-4 h-4" />}>Passes &amp; badges</DropdownItem>
                      </>
                    )}
                    <DropdownItem href="/dashboard/settings" icon={<Settings className="w-4 h-4" />}>Settings</DropdownItem>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#5C6157] hover:text-[#E5484D] hover:bg-[#E5484D]/5 transition-all rounded-xl"
                    >
                      <LogOut className="w-4 h-4" /> Disconnect wallet
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : connected ? (
          <Link
            href="/onboarding"
            className="flex items-center gap-3 px-6 py-2.5 rounded-full border border-[#9CFF1E] text-[13px] font-medium uppercase tracking-wide hover:bg-[#9CFF1E] hover:text-[#141414] transition-all"
          >
            Complete profile <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <button
            onClick={signIn}
            className={cn(
              "flex items-center gap-3 px-6 py-2.5 rounded-full border text-[13px] font-medium uppercase tracking-wide transition-all",
              onDark
                ? "border-[#9CFF1E] text-[#9CFF1E] hover:bg-[#9CFF1E] hover:text-[#141414]"
                : "border-[#9CFF1E] text-[#141414] hover:bg-[#9CFF1E]"
            )}
          >
            Connect Wallet <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      </div>
    </header>
  );
};

const DropdownItem = ({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <Link
    href={href}
    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#141414] hover:bg-[#9CFF1E]/30 transition-all rounded-xl"
  >
    {icon}
    {children}
  </Link>
);
