// The project URL and the publishable key. Both are public by design: the
// publishable key only reaches what row level security allows. The secret key
// is never read anywhere in this app.
//
// Written out in full so Next.js inlines them into the browser bundle.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const SUPABASE_CONFIGURED = SUPABASE_URL !== "" && SUPABASE_PUBLISHABLE_KEY !== "";
