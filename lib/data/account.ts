// The guest and berth holder side of the data: sign-in, profile, boats,
// arrival requests and relet offers. By default these read and write
// Supabase; with NEXT_PUBLIC_ACCOUNT_DATA=mock, or when no Supabase project is
// configured, the screens run on the browser mock as before.

import { SUPABASE_CONFIGURED } from "@/lib/supabase/env";

export const ACCOUNT_DATA_SOURCE: "supabase" | "mock" =
  process.env.NEXT_PUBLIC_ACCOUNT_DATA === "mock" || !SUPABASE_CONFIGURED ? "mock" : "supabase";

export {
  EMPTY_PROFILE,
  acceptProposedDates,
  cancelReletOffer,
  deleteBoat,
  listBoats,
  listMyArrivals,
  listMyBerthIds,
  listMyOffers,
  loadAccount,
  ownedBerthsFrom,
  requestArrival,
  requestReletEarlyReturn,
  saveProfile,
  sendLoginLink,
  signInWithPassword,
  signOutAccount,
  submitReletOffer,
  upsertBoat,
  type Account,
  type DbResult,
  type Holding,
  type MyArrival,
  type MyArrivalStatus,
  type ProfileFields,
  type ReletOfferInput,
  type LoginLinkResult,
} from "@/data/supabase/accounts";
export { dbErrorKey, type DbErrorKey } from "@/data/supabase/errors";
export { DEV_PASSWORD, SEEDED_PERSONAS, type SeededPersona } from "@/data/supabase/devPersonas";
