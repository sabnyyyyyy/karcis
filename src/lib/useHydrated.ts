import { useEffect, useState } from "react";

/** True setelah komponen mount di client. Dipakai supaya data dari localStorage tidak bentrok dengan HTML server. */
export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
};
