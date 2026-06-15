"use client";

import React from "react";
import { ScrollReveal } from "@/components/animations/SpatialSystem";
import { 
  User, 
  Shield, 
  Wallet, 
  Bell,
  Lock,
  LogOut,
  Unlink,
  CheckCircle2,
  Trash2,
  Mail,
  Smartphone
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { connected, publicKey, disconnect } = useWallet();
  const router = useRouter();

  const handleFullLogout = async () => {
    if (connected) {
      await disconnect();
    }
    logout();
    router.push("/");
  };

  return (
    <div className="space-y-16 max-w-4xl pb-20">
      <section className="border-b border-on-background/5 pb-8">
        <ScrollReveal>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-accent uppercase tracking-[0.4em] italic leading-none">System Configuration</p>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-text-main">Settings</h1>
          </div>
        </ScrollReveal>
      </section>

      {/* 1. PROFILE */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 border-b border-on-background/5 pb-4">
          <User className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-text-main">Identity Profile</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest italic">Display Name</label>
            <input type="text" defaultValue={user?.name} className="w-full bg-surface-alt border border-on-background/10 rounded-2xl px-6 py-4 text-sm font-bold uppercase tracking-tight focus:border-accent outline-none transition-all italic shadow-xl text-text-main" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest italic">Archival Username</label>
            <input type="text" defaultValue={user?.name?.toLowerCase().replace(" ", "_")} className="w-full bg-surface-alt border border-on-background/10 rounded-2xl px-6 py-4 text-sm font-bold uppercase tracking-tight focus:border-accent outline-none transition-all italic shadow-xl text-text-main" />
          </div>
          <div className="md:col-span-2 space-y-3">
            <label className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest italic">Bio / Narrative</label>
            <textarea className="w-full bg-surface-alt border border-on-background/10 rounded-[32px] px-6 py-5 text-sm font-bold uppercase tracking-tight focus:border-accent outline-none transition-all min-h-[120px] resize-none italic shadow-xl text-text-main" placeholder="Enter your archival bio..." />
          </div>
        </div>
      </section>

      {/* 2. ACCOUNT */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 border-b border-on-background/5 pb-4">
          <Mail className="w-5 h-5 text-accent-pink" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-text-main">Account Sync</h2>
        </div>
        <div className="space-y-8 max-w-md">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-text-muted/40 uppercase tracking-widest italic">Verified Email</label>
            <input type="email" defaultValue={user?.email} disabled className="w-full bg-white/[0.02] border border-on-background/5 rounded-2xl px-6 py-4 text-sm font-bold uppercase tracking-tight text-text-muted/40 cursor-not-allowed italic" />
          </div>
          <button className="text-accent text-[10px] font-black uppercase tracking-widest italic border-b border-accent/20 pb-1 hover:text-text-main hover:border-white transition-all">
            Initiate Password Reset Protocol
          </button>
        </div>
      </section>

      {/* 3. WALLET */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 border-b border-on-background/5 pb-4">
          <Wallet className="w-5 h-5 text-accent-blue" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-text-main">Archival Ledger</h2>
        </div>
        <div className="p-10 bg-surface-alt border border-on-background/10 rounded-[40px] space-y-8 shadow-2xl">
          {connected ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-accent/60 uppercase tracking-widest italic leading-none">Synchronized Protocol</p>
                  <p className="text-lg font-mono font-bold tracking-tight text-text-muted/60 leading-none">{publicKey?.toBase58().slice(0, 12)}...{publicKey?.toBase58().slice(-12)}</p>
                </div>
                <button onClick={() => disconnect()} className="flex items-center gap-3 px-6 py-3 bg-accent-pink/5 border border-accent-pink/20 rounded-full text-accent-pink hover:bg-accent-pink hover:text-background transition-all text-[10px] font-black uppercase tracking-widest italic shadow-lg">
                  <Unlink className="w-4 h-4" /> Disconnect Ledger
                </button>
              </div>
              <button className="w-full py-5 bg-white/[0.03] border border-on-background/10 rounded-2xl text-text-muted/40 text-[10px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all italic shadow-lg">
                Register Alternate Protocol
              </button>
            </>
          ) : (
            <div className="text-center py-10 space-y-6">
               <p className="text-[11px] font-black text-text-muted/30 uppercase tracking-widest italic">No architectural ledger synchronized</p>
               <button className="px-10 py-5 bg-accent text-background rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-accent-vibrant transition-all italic shadow-xl">
                 Synchronize Wallet
               </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. SECURITY */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 border-b border-on-background/5 pb-4">
          <Shield className="w-5 h-5 text-accent-lime" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-text-main">Security Infrastructure</h2>
        </div>
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-surface border border-on-background/5 rounded-[32px] gap-8 shadow-xl">
              <div className="space-y-2">
                 <div className="flex items-center gap-3">
                    <Smartphone className="w-4 h-4 text-text-muted/30" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-muted/60 italic">Active Sessions</p>
                 </div>
                 <p className="text-sm text-text-muted/40 font-medium italic">Current Browser: Chrome on Windows • Indonesia</p>
              </div>
              <div className="flex items-center gap-4">
                 <span className="px-4 py-2 bg-white/[0.03] border border-on-background/10 rounded-full text-[9px] font-black text-text-muted/30 uppercase tracking-widest italic">Last Sync: 2h ago</span>
                 <button className="text-accent-pink text-[10px] font-black uppercase tracking-widest italic hover:text-text-main transition-all">Terminate All Other Devices</button>
              </div>
           </div>
        </div>
      </section>

      {/* 5. PREFERENCES */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 border-b border-on-background/5 pb-4">
          <Bell className="w-5 h-5 text-accent-orange" />
          <h2 className="text-xl font-black italic uppercase tracking-tight text-text-main">Notification Protocols</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[
            { label: "Event Synchronization Alerts", active: true },
            { label: "Archival Price Movements", active: true },
            { label: "Resale Center Transmissions", active: false },
            { label: "Security Infrastructure Logs", active: true }
          ].map((pref) => (
            <div key={pref.label} className="flex justify-between items-center p-6 bg-surface border border-on-background/5 rounded-2xl hover:border-on-background/10 transition-all cursor-pointer group shadow-lg">
              <span className="text-[11px] font-black uppercase tracking-widest italic text-text-muted/50 group-hover:text-text-main transition-colors">{pref.label}</span>
              <div className={cn(
                "w-12 h-6 rounded-full relative transition-all duration-500",
                pref.active ? "bg-accent/30" : "bg-white/[0.05]"
              )}>
                <div className={cn(
                  "w-4 h-4 rounded-full absolute top-1 transition-all duration-500 shadow-xl",
                  pref.active ? "right-1 bg-accent" : "left-1 bg-white/10"
                )} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SYSTEM ACTIONS */}
      <section className="pt-20 border-t border-on-background/5 flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-lg font-black italic text-text-muted/30 uppercase tracking-tight leading-none">System Exit Protocol</p>
          <p className="text-xs text-text-muted/20 font-medium italic leading-none">Terminate archival access and clear synchronization layer caches.</p>
        </div>
        <button 
          onClick={handleFullLogout}
          className="flex items-center gap-4 px-12 py-5 bg-accent-pink/5 text-accent-pink border border-accent-pink/20 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-accent-pink hover:text-background transition-all italic shadow-2xl"
        >
          <LogOut className="w-4 h-4" /> Terminate Archive Access
        </button>
      </section>
    </div>
  );
}
