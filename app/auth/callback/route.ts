import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where a staff sign-in link lands. Supabase adds a one-time code, which is
// swapped for a session cookie here. A bad or used link goes back to the
// sign-in page with a message.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/staff/arrivals`);
  }
  return NextResponse.redirect(`${origin}/staff/login?error=link`);
}
