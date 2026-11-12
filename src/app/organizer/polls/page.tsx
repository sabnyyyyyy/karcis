"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Trash2, ArrowUpRight, Lock } from "lucide-react";
import { EditorialFooter } from "@/components/layout/Footer";
import { OrganizerGuard } from "@/components/layout/OrganizerGuard";
import { useProfile } from "@/store/useAuthStore";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { useHydrated } from "@/lib/useHydrated";
import { usePolls } from "@/lib/chain/hooks";
import { closePollTx, createPollTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { VOTE_MIN } from "@/lib/community";
import { cn } from "@/lib/utils";

const field =
  "w-full rounded-2xl border border-[#141414]/15 bg-white px-5 py-3.5 text-[15px] outline-none focus:border-[#9CFF1E] focus:ring-2 focus:ring-[#9CFF1E]/40 transition";

export default function OrganizerPollsPage() {
  return (
    <OrganizerGuard>
      <Polls />
    </OrganizerGuard>
  );
}

function Polls() {
  const hydrated = useHydrated();
  const profile = useProfile();
  const { accountId, sendTransactions } = useNearWallet();
  const { data: polls = [] } = usePolls();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!hydrated || !profile?.organizer || !accountId) return <div className="min-h-screen" />;

  const mine = polls.filter((p) => p.creator === accountId);

  const run = async (key: string, tx: ReturnType<typeof createPollTx>, after?: () => void) => {
    setBusy(key);
    setError(null);
    try {
      await sendTransactions([tx], { callbackUrl: window.location.href });
      after?.();
    } catch (err) {
      setError(explainChainError(err));
    } finally {
      setBusy(null);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || clean.length < 2) return setError("Enter a question and at least two options.");
    void run("create", createPollTx(question.trim(), clean), () => {
      setQuestion("");
      setOptions(["", ""]);
    });
  };

  return (
    <main data-nav-theme="light" className="min-h-screen bg-white text-[#141414] pt-16 flex flex-col">
      <section className="relative px-6 md:px-12 py-14 overflow-hidden flex-1">
        <div className="absolute inset-0 lime-grid [mask-image:linear-gradient(180deg,#000,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto space-y-12">
          <div className="space-y-4">
            <Link href="/organizer" className="inline-flex items-center gap-1 text-sm text-[#5C6157] hover:text-[#141414]">
              <ChevronLeft className="w-4 h-4" /> Dashboard
            </Link>
            <h1 className="text-[36px] md:text-[52px] font-extrabold tracking-[-0.04em] leading-none">Guest star polls</h1>
            <p className="text-[#5C6157] max-w-lg">
              Let attendees who showed up have a say. Only holders of {VOTE_MIN} stamps from your events can vote, one account one vote. Polls are recorded on the NEAR contract (about 0.02 NEAR is needed for storage, the rest is refunded).
            </p>
          </div>

          <form onSubmit={submit} className="p-6 md:p-8 rounded-[28px] border border-black/10 bg-[#F5F8EE] space-y-5">
            <label className="block space-y-2 text-[13px] font-semibold">
              Question
              <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Who should be the guest band at the next event?" className={cn(field, "font-normal")} />
            </label>

            <div className="space-y-3">
              <p className="text-[13px] font-semibold">Options</p>
              {options.map((o, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={o}
                    onChange={(e) => setOptions((os) => os.map((x, j) => (j === i ? e.target.value : x)))}
                    placeholder={`Option ${i + 1}`}
                    className={cn(field, "font-normal")}
                  />
                  <button
                    type="button"
                    disabled={options.length <= 2}
                    onClick={() => setOptions((os) => os.filter((_, j) => j !== i))}
                    aria-label="Remove option"
                    className="w-[52px] shrink-0 rounded-2xl border border-[#141414]/15 flex items-center justify-center hover:bg-[#E5484D] hover:text-white hover:border-[#E5484D] transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {options.length < 6 && (
                <button type="button" onClick={() => setOptions((os) => [...os, ""])} className="inline-flex items-center gap-2 text-sm font-semibold text-[#3F7D00] hover:underline">
                  <Plus className="w-4 h-4" /> Add option
                </button>
              )}
            </div>

            {error && <p className="text-[#E5484D] text-sm font-medium">{error}</p>}

            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-[#141414] font-semibold hover:shadow-[0_0_40px_rgba(156,255,30,0.6)] transition-shadow disabled:opacity-60"
              style={{ background: "linear-gradient(180deg, #C6FF6B 0%, #9CFF1E 100%)" }}
            >
              {busy === "create" ? "Waiting for wallet…" : "Open poll"} <ArrowUpRight className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Your polls</h2>
            {mine.length === 0 ? (
              <p className="text-[#5C6157]">No polls yet. Create the first one above.</p>
            ) : (
              mine.map((p) => {
                const total = p.total;
                return (
                  <div key={p.id} className="p-6 rounded-3xl border border-black/10 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-lg font-semibold leading-snug">{p.question}</h3>
                      {!p.closed ? (
                        <button
                          disabled={busy !== null}
                          onClick={() => run(`close-${p.id}`, closePollTx(p.id))}
                          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border border-[#141414]/20 text-xs font-semibold uppercase tracking-widest hover:bg-[#141414] hover:text-white transition-colors disabled:opacity-50"
                        >
                          <Lock className="w-3.5 h-3.5" /> {busy === `close-${p.id}` ? "Waiting…" : "Close"}
                        </button>
                      ) : (
                        <span className="shrink-0 px-3 py-1.5 rounded-full bg-black/5 text-xs font-semibold uppercase tracking-widest">Closed</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {p.options.map((label, i) => {
                        const n = p.counts[i] ?? 0;
                        const pct = total ? Math.round((n / total) * 100) : 0;
                        return (
                          <div key={i} className="relative overflow-hidden rounded-2xl border border-black/10 px-4 py-3">
                            <div className="absolute inset-y-0 left-0 bg-[#9CFF1E]/50 transition-all duration-700" style={{ width: `${pct}%` }} />
                            <div className="relative flex justify-between text-sm">
                              <span className="font-medium">{label}</span>
                              <span className="font-semibold tabular-nums">{pct}% · {n}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-[#5C6157]">{total} votes</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
      <EditorialFooter />
    </main>
  );
}
