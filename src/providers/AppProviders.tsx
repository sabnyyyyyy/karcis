"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SolanaWalletProvider } from "./SolanaWalletProvider";

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <SolanaWalletProvider>
        {children}
      </SolanaWalletProvider>
    </QueryClientProvider>
  );
};
