"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Field from "@/components/ui/Field";
import { useStaffText } from "./StaffLanguageProvider";
import { sendStaffSignInLink, type SignInLinkResult } from "@/lib/data";

// Email magic link sign-in for marina staff. There is no sign-up: the link
// only signs in an address the marina has already invited.
export default function StaffLogin() {
  const { s } = useStaffText();
  const copy = s.login;
  const linkFailed = useSearchParams().get("error") === "link";
  const [email, setEmail] = useState("");
  // Kept as keys, not text, so switching language retranslates them.
  const [error, setError] = useState(false);
  const [status, setStatus] = useState<SignInLinkResult | "link" | null>(
    linkFailed ? "link" : null
  );
  const [sentTo, setSentTo] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setError(true);
      setStatus(null);
      return;
    }
    setError(false);
    setSending(true);
    const result = await sendStaffSignInLink(address, `${window.location.origin}/auth/callback`);
    setSending(false);
    setSentTo(address);
    setStatus(result);
  }

  const message =
    status === "link"
      ? copy.linkFailed
      : status === "sent"
        ? copy.sent(sentTo)
        : status === "too-many"
          ? copy.tooMany
          : status === "failed"
            ? copy.failed
            : "";

  return (
    <div className="page-reading">
      <h1 className="type-heading type-h2 text-ink">{copy.title}</h1>
      <p className="measure mt-2 text-ink-soft">{copy.intro}</p>
      <form onSubmit={handleSubmit} noValidate className="mt-6 max-w-md">
        <Field
          label={copy.email}
          htmlFor="staff-email"
          error={error ? copy.errEmail : undefined}
          required
        >
          <input
            id="staff-email"
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
      </form>
    </div>
  );
}
