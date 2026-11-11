"use client";

import React, { useState } from "react";
import { Lock, Check, Vote } from "lucide-react";
import { cn } from "@/lib/utils";
import { VOTE_MIN } from "@/lib/community";
import { useMyVote, usePolls, useStampsWith } from "@/lib/chain/hooks";
import { useNearWallet } from "@/providers/NearWalletProvider";
import { voteTx } from "@/lib/chain/builders";
import { explainChainError } from "@/lib/chain/errors";
import { shortAccount } from "@/lib/chain/format";
import type { ChainPoll } from "@/lib/chain/types";

export function PollsPanel({ accountId }: { accountId: string }) {
  const { data: polls = [], isLoading, error } = usePolls();

  const open = polls.filter((p) => !p.closed);
  const closed = polls.filter((p) => p.closed);

  if (isLoading) return <div className="h-40 rounded-3xl bg-surface-low animate-pulse" />;
  if (error) return <p className="text-text-muted">{explainChainError(error)}</p>;

  return (
    <div className="space-y-8">
      <p className="text-sm text-text-muted max-w-2xl">
        Hak suara dihitung dari stempel yang kamu kumpulkan di event milik penyelenggara pembuat voting (minimal {VOTE_MIN}). Suara dan hasilnya tercatat di kontrak.
      </p>

      {open.length === 0 && closed.length === 0 && <p className="text-text-muted">Belum ada voting dari penyelenggara.</p>}

      <div className="grid lg:grid-cols-2 gap-5">
        {open.map((p) => (
          <PollCard key={p.id} poll={p} accountId={accountId} />
        ))}
      </div>

      {closed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-muted">Sudah ditutup</h3>
          <div className="grid lg:grid-cols-2 gap-5">
            {closed.map((p) => (
              <PollCard key={p.id} poll={p} accountId={accountId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PollCard({ poll, accountId }: { poll: ChainPoll; accountId: string }) {
  const { sendTransactions } = useNearWallet();
  const myVote = useMyVote(poll.id, accountId);
  const stamps = useStampsWith(accountId, poll.creator);
  const [sending, setSending] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mine = myVote.data ?? null;
  const have = stamps.data ?? 0;
  const canVote = have >= VOTE_MIN && !poll.closed && mine === null;
  const showResults = mine !== null || poll.closed;
  const max = Math.max(...poll.counts, 0);
  const winner = poll.closed && poll.total > 0 ? poll.counts.indexOf(max) : -1;

  const cast = async (index: number) => {
    setSending(index);
    setError(null);
    try {
      await sendTransactions([voteTx(poll.id, index)], { callbackUrl: window.location.href });
    } catch (e) {
      setError(explainChainError(e));
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="p-6 rounded-3xl border border-on-background/10 bg-white space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          <Vote className="w-3.5 h-3.5" /> {poll.organizer_name || shortAccount(poll.creator)}
          {poll.closed && <span className="px-2 py-0.5 rounded-full bg-black/5 normal-case tracking-normal">Ditutup</span>}
        </div>
        <h3 className="text-xl font-semibold tracking-[-0.02em] leading-snug">{poll.question}</h3>
      </div>

      {!poll.closed && mine === null && have < VOTE_MIN && !stamps.isLoading && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#F5F8EE] text-sm text-text-muted">
          <Lock className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Butuh {VOTE_MIN} stempel dari event {poll.organizer_name || shortAccount(poll.creator)}. Kamu punya {have}.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {poll.options.map((label, i) => {
          const n = poll.counts[i] ?? 0;
          const pct = poll.total ? Math.round((n / poll.total) * 100) : 0;
          const chosen = mine === i;
          const isWinner = winner === i;

          if (showResults) {
            return (
              <div key={i} className={cn("relative overflow-hidden rounded-2xl border px-4 py-3", chosen ? "border-[#9CFF1E]" : "border-on-background/10")}>
                <div className={cn("absolute inset-y-0 left-0 transition-all duration-700", isWinner || chosen ? "bg-[#9CFF1E]/50" : "bg-black/5")} style={{ width: `${pct}%` }} />
                <div className="relative flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    {chosen && <Check className="w-4 h-4" />}
                    {label}
                  </span>
                  <span className="font-semibold tabular-nums">{pct}% · {n}</span>
                </div>
              </div>
            );
          }

          return (
            <button
              key={i}
              disabled={!canVote || sending !== null}
              onClick={() => cast(i)}
              className={cn(
                "w-full text-left rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
                canVote ? "border-on-background/15 hover:border-[#9CFF1E] hover:bg-[#9CFF1E]/15" : "border-on-background/10 opacity-60 cursor-not-allowed"
              )}
            >
              {sending === i ? "Menunggu wallet…" : label}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-accent-coral">{error}</p>}

      <p className="text-xs text-text-muted">
        {poll.total} suara{mine !== null ? " · suaramu sudah masuk" : canVote ? " · satu akun satu suara, tidak bisa diubah" : ""}
      </p>
    </div>
  );
}
