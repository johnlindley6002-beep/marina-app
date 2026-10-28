"use client";

import { useMemo } from "react";
import { ACCOUNT_DATA_SOURCE, getOwnedBerths, ownedBerthsFrom, type OwnedBerth } from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";
import { useBoats } from "@/components/providers/BoatProvider";

// The berths the signed-in person holds today. On Supabase they come from the
// holding the marina created for them, and the boat on file is the one they
// saved under My boat. On the mock they come from the sample links.
export function useOwnedBerths(): OwnedBerth[] {
  const { user, account } = useAuth();
  const { activeBoat, boats } = useBoats();
  const userId = user?.id ?? null;
  const boat = activeBoat ?? boats[0] ?? null;
  return useMemo(
    () =>
      ACCOUNT_DATA_SOURCE === "supabase" ? ownedBerthsFrom(account, boat) : getOwnedBerths(userId),
    [account, boat, userId]
  );
}
