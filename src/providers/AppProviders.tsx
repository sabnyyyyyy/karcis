"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { NearWalletProvider } from "./NearWalletProvider";
import { AuthGate } from "./AuthGate";

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <NearWalletProvider>
        <AuthGate />
        {children}
      </NearWalletProvider>
    </QueryClientProvider>
  );
};
