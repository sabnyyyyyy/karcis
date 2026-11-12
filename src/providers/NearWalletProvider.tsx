"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { WalletSelector } from "@near-wallet-selector/core";
import type { WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { useQueryClient } from "@tanstack/react-query";
import { actionCreators } from "@near-js/transactions";
import { CHAIN } from "@/lib/chain/config";
import { ChainError, assertOutcomeOk } from "@/lib/chain/errors";
import type { PreparedTx } from "@/lib/chain/builders";

// Styles for the NEAR wallet selector modal
import "@near-wallet-selector/modal-ui/styles.css";

interface SendOptions {
  /** URL tujuan setelah wallet berbasis redirect selesai menandatangani */
  callbackUrl?: string;
}

interface NearWalletContextValue {
  /** Akun NEAR yang tersambung, mis. "budi.testnet" */
  accountId: string | null;
  /** True setelah wallet selector selesai inisialisasi di client */
  isReady: boolean;
  network: "testnet" | "mainnet";
  /** Membuka modal pilihan wallet */
  signIn: () => void;
  signOut: () => Promise<void>;
  /**
   * Tanda tangani dan kirim satu atau beberapa transaksi. Wallet berbasis redirect (MyNearWallet)
   * meninggalkan halaman ini, jadi promise-nya tidak selesai; wallet lain mengembalikan hasil.
   */
  sendTransactions: (txs: PreparedTx[], options?: SendOptions) => Promise<unknown>;
}

const NearWalletContext = createContext<NearWalletContextValue | undefined>(undefined);

const gasUnits = (tgas: number) => BigInt(Math.round(tgas)) * 10n ** 12n;

export const NearWalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const selectorRef = useRef<WalletSelector | null>(null);
  const modalRef = useRef<WalletSelectorModal | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    // Wallet modules touch `window`, so they are loaded on the client only.
    (async () => {
      const [{ setupWalletSelector }, { setupModal }, { setupMyNearWallet }, { setupMeteorWallet }, { setupHotWallet }] =
        await Promise.all([
          import("@near-wallet-selector/core"),
          import("@near-wallet-selector/modal-ui"),
          import("@near-wallet-selector/my-near-wallet"),
          import("@near-wallet-selector/meteor-wallet"),
          import("@near-wallet-selector/hot-wallet"),
        ]);

      const selector = await setupWalletSelector({
        network: CHAIN.network,
        modules: [setupMyNearWallet(), setupMeteorWallet(), setupHotWallet()],
        // Saat sign-in wallet membuat kunci terbatas untuk kontrak Karcis, jadi aksi tanpa deposit
        // (mis. check-in di pintu masuk) bisa ditandatangani tanpa popup.
        createAccessKeyFor: CHAIN.contractId,
      });
      if (cancelled) return;

      selectorRef.current = selector;
      modalRef.current = setupModal(selector, { theme: "light", contractId: CHAIN.contractId });

      const pickAccount = (accounts: { accountId: string; active: boolean }[]) =>
        accounts.find((a) => a.active)?.accountId ?? accounts[0]?.accountId ?? null;

      setAccountId(pickAccount(selector.store.getState().accounts));
      const subscription = selector.store.observable.subscribe((state) => {
        setAccountId(pickAccount(state.accounts));
      });
      unsubscribe = () => subscription.unsubscribe();
      setIsReady(true);
    })().catch((err) => {
      console.error("Failed to initialise NEAR wallet selector", err);
      // Tetap tandai siap supaya UI tidak menggantung
      setIsReady(true);
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(() => {
    modalRef.current?.show();
  }, []);

  const signOut = useCallback(async () => {
    const selector = selectorRef.current;
    if (selector && selector.isSignedIn()) {
      const wallet = await selector.wallet();
      await wallet.signOut();
    }
    queryClient.clear();
  }, [queryClient]);

  const sendTransactions = useCallback(
    async (txs: PreparedTx[], options: SendOptions = {}) => {
      const selector = selectorRef.current;
      if (!selector || !selector.isSignedIn()) throw new ChainError("Connect your wallet first.");
      if (txs.length === 0) return undefined;
      const wallet = await selector.wallet();

      const toTransaction = (tx: PreparedTx) => ({
        receiverId: tx.receiverId,
        actions: [actionCreators.functionCall(tx.methodName, tx.args, gasUnits(tx.gasTgas), BigInt(tx.depositYocto))],
      });

      let outcome: unknown;
      if (txs.length === 1) {
        outcome = await wallet.signAndSendTransaction({ ...toTransaction(txs[0]), callbackUrl: options.callbackUrl });
      } else {
        outcome = await wallet.signAndSendTransactions({
          transactions: txs.map(toTransaction),
          callbackUrl: options.callbackUrl,
        });
      }
      assertOutcomeOk(outcome);
      // Data chain berubah: muat ulang semua query
      await queryClient.invalidateQueries();
      return outcome;
    },
    [queryClient]
  );

  const value = useMemo(
    () => ({ accountId, isReady, network: CHAIN.network, signIn, signOut, sendTransactions }),
    [accountId, isReady, signIn, signOut, sendTransactions]
  );

  return <NearWalletContext.Provider value={value}>{children}</NearWalletContext.Provider>;
};

export const useNearWallet = () => {
  const ctx = useContext(NearWalletContext);
  if (!ctx) throw new Error("useNearWallet must be used inside <NearWalletProvider>");
  return ctx;
};
