import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

// The Supabase client for client components. The library keeps one instance
// per browser tab, and the session lives in cookies shared with the server.
export function createClient(): SupabaseClient {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
