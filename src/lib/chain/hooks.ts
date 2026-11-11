"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNearWallet } from "@/providers/NearWalletProvider";
import type { CommunityEvent } from "@/data/events";
import type { Pass } from "@/types/pass";
import { chain } from "./contract";
import { toUiEvent, toUiPass } from "./adapters";

const STALE = 10_000;

/** Semua event di kontrak (terbaru di atas) */
export const useChainEvents = () =>
  useQuery({
    queryKey: ["events"],
    staleTime: STALE,
    queryFn: async (): Promise<CommunityEvent[]> => (await chain.events()).map(toUiEvent).reverse(),
  });

/** Satu event. `id` kosong = query dimatikan. */
export const useChainEvent = (id: string | undefined) =>
  useQuery({
    queryKey: ["event", id],
    enabled: !!id,
    staleTime: STALE,
    queryFn: async (): Promise<CommunityEvent | null> => {
      const e = await chain.event(id as string);
      return e ? toUiEvent(e) : null;
    },
  });

export const useQuote = (eventId: string | undefined, tierId: string | undefined) =>
  useQuery({
    queryKey: ["quote", eventId, tierId],
    enabled: !!eventId && !!tierId,
    staleTime: STALE,
    queryFn: () => chain.quote(eventId as string, tierId as string),
  });

/** Pass milik akun yang tersambung, digabung dengan data event (terbaru di atas) */
export const useMyPassesQuery = () => {
  const { accountId } = useNearWallet();
  const events = useChainEvents();
  const passes = useQuery({
    queryKey: ["passes", accountId],
    enabled: !!accountId,
    staleTime: 5_000,
    refetchInterval: 20_000,
    queryFn: () => chain.passesFor(accountId as string),
  });

  const data = useMemo<Pass[]>(() => {
    if (!passes.data) return [];
    const byId = new Map((events.data ?? []).map((e) => [e.id, e]));
    return passes.data
      .map((p) => toUiPass(p, byId.get(p.event_id)))
      .sort((a, b) => +new Date(b.mintedAt) - +new Date(a.mintedAt));
  }, [passes.data, events.data]);

  return {
    data,
    isLoading: passes.isLoading || events.isLoading,
    error: passes.error ?? events.error,
    refetch: passes.refetch,
  };
};

/** Pass milik akun yang tersambung (kosong selama memuat) */
export const useMyPasses = (): Pass[] => useMyPassesQuery().data;

/** Satu pass berdasarkan ID token, siapa pun pemiliknya */
export const useChainPass = (id: string | undefined) => {
  const events = useChainEvents();
  const pass = useQuery({
    queryKey: ["pass", id],
    enabled: !!id,
    staleTime: 5_000,
    queryFn: () => chain.pass(id as string),
  });
  const data = useMemo<Pass | null>(() => {
    if (!pass.data) return null;
    return toUiPass(pass.data, (events.data ?? []).find((e) => e.id === pass.data?.event_id));
  }, [pass.data, events.data]);
  return { data, isLoading: pass.isLoading || events.isLoading, error: pass.error, refetch: pass.refetch };
};

export const useCampaign = (eventId: string | undefined) =>
  useQuery({
    queryKey: ["campaign", eventId],
    enabled: !!eventId,
    staleTime: 5_000,
    refetchInterval: 20_000,
    queryFn: () => chain.campaign(eventId as string),
  });

export const useJoinedCampaigns = (account: string | null) =>
  useQuery({
    queryKey: ["joined", account],
    enabled: !!account,
    staleTime: STALE,
    queryFn: () => chain.campaignsJoinedBy(account as string),
  });

export const usePolls = () => useQuery({ queryKey: ["polls"], staleTime: 5_000, refetchInterval: 20_000, queryFn: () => chain.polls() });

export const useMyVote = (pollId: string, account: string | null) =>
  useQuery({
    queryKey: ["myVote", pollId, account],
    enabled: !!account,
    staleTime: 5_000,
    queryFn: () => chain.myVote(pollId, account as string),
  });

export const useStampsWith = (account: string | null, organizer: string | undefined) =>
  useQuery({
    queryKey: ["stampsWith", account, organizer],
    enabled: !!account && !!organizer,
    staleTime: STALE,
    queryFn: () => chain.stampsWith(account as string, organizer as string),
  });

/** Hadiah/dana yang menunggu diklaim akun ini (unit token) */
export const useUnclaimed = (account: string | null) =>
  useQuery({
    queryKey: ["unclaimed", account],
    enabled: !!account,
    staleTime: 5_000,
    refetchInterval: 20_000,
    queryFn: async () => Number(await chain.unclaimed(account as string)),
  });

export const useTokenBalance = (account: string | null) =>
  useQuery({
    queryKey: ["tokenBalance", account],
    enabled: !!account,
    staleTime: 5_000,
    queryFn: async () => Number(await chain.tokenBalance(account as string)),
  });

export const useTokenRegistered = (account: string | null) =>
  useQuery({
    queryKey: ["tokenRegistered", account],
    enabled: !!account,
    staleTime: 15_000,
    queryFn: () => chain.tokenRegistered(account as string),
  });

/** Pass yang sedang dijual ulang (terbaru di atas) */
export const useListings = () =>
  useQuery({ queryKey: ["listings"], staleTime: 5_000, refetchInterval: 20_000, queryFn: () => chain.listings() });

export const useListing = (passId: string | undefined) =>
  useQuery({
    queryKey: ["listing", passId],
    enabled: !!passId,
    staleTime: 5_000,
    queryFn: () => chain.listing(passId as string),
  });

/** Catatan penyelenggara on-chain; null = belum terdaftar */
export const useOrganizer = (account: string | null | undefined) =>
  useQuery({
    queryKey: ["organizer", account],
    enabled: !!account,
    staleTime: 5_000,
    queryFn: () => chain.organizer(account as string),
  });

export const useOrganizers = () => useQuery({ queryKey: ["organizers"], staleTime: 5_000, queryFn: () => chain.organizers() });

export const useChainConfig = () => useQuery({ queryKey: ["config"], staleTime: 60_000, queryFn: () => chain.config() });
