"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ACCOUNT_DATA_SOURCE, sendLoginLink, type LoginLinkResult } from "@/lib/data";
import Field from "@/components/ui/Field";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";

// A path on this site, or the default. The same check the callback makes.
function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/my-arrivals";
  }
  return value;
}

// Email link sign-in for guests and berth holders. There is no password and no
// separate sign-up: a new address gets an account, and the berth holder role
// is added only when the marina links the person to a berth.
export default function LoginContent() {
  const { t } = useLanguage();
  const copy = t.accounts.login;
  const { ready, user } = useAuth();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  // Kept as keys, not text, so switching language retranslates them.
  const [invalid, setInvalid] = useState(false);
  const [status, setStatus] = useState<LoginLinkResult | "link" | null>(
    params.get("error") === "link" ? "link" : null
  );
  const [sentTo, setSentTo] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setInvalid(true);
      setStatus(null);
      return;
    }
    setInvalid(false);
    setSending(true);
    // The page to return to, for one hour (the life of the link).
    document.cookie = `aldock_next=${encodeURIComponent(next)}; path=/; max-age=3600; SameSite=Lax`;
    const result = await sendLoginLink(address, `${window.location.origin}/auth/callback`);
    setSending(false);
    setSentTo(address);
    setStatus(result);
  }

  const message =
    status === "link"
      ? copy.linkProblem
      : status === "too-many"
        ? copy.tooMany
        : status === "failed"
          ? copy.failed
          : "";

  return (
    <div className="section">
      <div className="page-column page-reading">
        <PageHeader title={copy.title}>{copy.intro}</PageHeader>

        {ACCOUNT_DATA_SOURCE === "mock" ? (
          <p className="measure mt-8 text-ink-soft">{copy.previewNote}</p>
        ) : ready && user ? (
          <div className="mt-8">
            <p className="text-ink">{copy.signedIn(user.name)}</p>
            <Link href={next} className="btn-primary mt-4">
              {copy.continue}
            </Link>
          </div>
        ) : status === "sent" ? (
          <div className="mt-8 max-w-md" role="status">
            <h2 className="type-heading type-h3 text-ink">{copy.sentTitle}</h2>
            <p className="mt-2 text-ink-soft">{copy.sentBody(sentTo)}</p>
            <button type="button" onClick={() => setStatus(null)} className="btn-quiet mt-4">
              {copy.useAnother}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-8 max-w-md">
            <Field
              label={copy.emailLabel}
              htmlFor="login-email"
              error={invalid ? copy.errEmail : undefined}
              required
            >
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
              />
            </Field>
            <button type="submit" disabled={sending} className="btn-primary mt-4">
              {sending ? copy.sending : copy.send}
            </button>
            <p role="status" className="mt-4 min-h-6 text-sm font-medium text-ink">
              {message}
            </p>
            <p className="mt-2 text-sm text-ink-muted">{copy.privacy}</p>
          </form>
        )}
      </div>
    </div>
  );
}
