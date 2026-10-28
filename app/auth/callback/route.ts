import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// A path on this site, or nothing. Anything else (another site, a protocol
// relative address) is dropped so the link cannot send someone elsewhere.
function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  return value;
}

// Where a sign-in link lands. Supabase adds a one-time code, which is swapped
// for a session cookie here. Guests go on to the page they asked for; staff
// without one go to the arrivals board. A bad or used link goes back to the
// sign-in page it came from, with a message.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const stored = request.cookies.get("aldock_next")?.value;
  let decoded: string | null = null;
  try {
    decoded = stored ? decodeURIComponent(stored) : null;
  } catch {
    decoded = null;
  }
  const next = safeNext(decoded);
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let target = next;
      if (!target) {
        const { data } = await supabase.from("staff_members").select("marina_id").limit(1);
        target = (data ?? []).length > 0 ? "/staff/arrivals" : "/my-arrivals";
      }
      const done = NextResponse.redirect(`${origin}${target}`);
      done.cookies.delete("aldock_next");
      return done;
    }
  }
  const failed = NextResponse.redirect(`${origin}${next ? "/login" : "/staff/login"}?error=link`);
  failed.cookies.delete("aldock_next");
  return failed;
}
