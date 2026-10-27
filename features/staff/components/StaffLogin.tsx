"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Field from "@/components/ui/Field";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { sendStaffSignInLink } from "@/lib/data";

// Email magic link sign-in for marina staff. There is no sign-up: the link
// only signs in an address the marina has already invited.
export default function StaffLogin() {
  const { t } = useLanguage();
  const copy = t.staffLogin;
  const linkFailed = useSearchParams().get("error") === "link";
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState(linkFailed ? copy.linkFailed : "");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setError(copy.errEmail);
      setStatus("");
      return;
    }
    setError("");
    setSending(true);
    const result = await sendStaffSignInLink(address, `${window.location.origin}/auth/callback`);
    setSending(false);
    setStatus(
      result === "sent" ? copy.sent(address) : result === "too-many" ? copy.tooMany : copy.failed
    );
  }

  return (
    <div className="page-reading">
      <h1 className="type-heading type-h2 text-ink">{copy.title}</h1>
      <p className="measure mt-2 text-ink-soft">{copy.intro}</p>
      <form onSubmit={handleSubmit} noValidate className="mt-6 max-w-md">
        <Field label={copy.email} htmlFor="staff-email" error={error || undefined} required>
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
          {status}
        </p>
      </form>
    </div>
  );
}
