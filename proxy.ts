import type { NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/session";

// Keeps the Supabase staff session fresh. Only the staff area and the sign-in
// callback use Supabase; the rest of the site never runs this.
export function proxy(request: NextRequest) {
  return refreshSession(request);
}

export const config = {
  matcher: ["/staff/:path*", "/auth/:path*"],
};
