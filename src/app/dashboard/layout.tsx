"use client";

import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { EditorialFooter } from "@/components/layout/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col dark-theme">
      <div className="flex-1 flex pt-20">
        <Sidebar />
        <main className="flex-1 ml-[280px] p-8 md:p-16 overflow-x-hidden border-l border-white/5 bg-gradient-to-br from-transparent to-accent/5">
          <div className="max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
      <div className="ml-[280px] border-t border-white/5">
        <EditorialFooter />
      </div>
    </div>
  );
}
