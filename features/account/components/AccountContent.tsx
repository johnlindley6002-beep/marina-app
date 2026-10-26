"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import type { CurrentUser } from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import PageHeader from "@/components/layout/PageHeader";
import RoleGate from "@/components/layout/RoleGate";

const inputClass = "field";
const labelClass = "field-label";
const errorClass = "field-error";

type Errors = Partial<Record<"name" | "email", string>>;

function ProfileForm({ user }: { user: CurrentUser }) {
  const { updateProfile } = useAuth();
  const { t } = useLanguage();
  const copy = t.account;
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = copy.errName;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      next.email = copy.errEmail;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setStatus("");
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      );
      return;
    }
    const ok = updateProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
    });
    setStatus(ok ? copy.saved : copy.saveFailed);
  }

  const aria = (key: keyof Errors) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `account-err-${key}` : undefined,
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className={labelClass}>{copy.name}</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className={inputClass}
            {...aria("name")}
          />
          {errors.name ? (
            <p id="account-err-name" role="alert" className={errorClass}>
              {errors.name}
            </p>
          ) : null}
        </label>
        <label className="block text-sm">
          <span className={labelClass}>{copy.email}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={inputClass}
            {...aria("email")}
          />
          {errors.email ? (
            <p id="account-err-email" role="alert" className={errorClass}>
              {errors.email}
            </p>
          ) : null}
        </label>
        <label className="block text-sm">
          <span className={labelClass}>{copy.phone}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            className={inputClass}
          />
        </label>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn-primary">
          {copy.save}
        </button>
        <p role="status" className="min-h-6 text-sm font-medium text-ink">
          {status}
        </p>
      </div>
    </form>
  );
}

function AccountBody() {
  const { user, canSwitchMode } = useAuth();
  const { t } = useLanguage();
  if (!user) return null;
  const copy = t.account;

  return (
    <div className="section">
      <div className="page-column page-reading">
        <PageHeader title={copy.title} mock>
          {copy.signedInAs(user.name)}
        </PageHeader>

        <section className="stack-md" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="type-heading type-h2 text-ink">
            {copy.profile}
          </h2>
          <div className="mt-6">
            {/* Keyed so switching account resets the form to that person. */}
            <ProfileForm key={user.id} user={user} />
          </div>
          <p className="measure mt-6 text-sm text-ink-muted">
            {copy.skipperNote}{" "}
            <Link href="/my-boat" className="underline underline-offset-4">
              {t.nav.myBoat}
            </Link>
            .
          </p>
        </section>

        <section className="chapter" aria-labelledby="roles-heading">
          <h2 id="roles-heading" className="type-heading type-h2 text-ink">
            {copy.roles}
          </h2>
          <ul className="mt-4">
            {user.roles.map((role) => (
              <li key={role} className="hairline-top py-4 first:border-t-0">
                <p className="type-heading type-h3 text-ink">{copy.roleCopy[role].title}</p>
                <p className="measure mt-1 text-ink-soft">{copy.roleCopy[role].how}</p>
              </li>
            ))}
          </ul>

          <p className="type-label mt-6">{copy.howRolesWork}</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-soft">
            {copy.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        {canSwitchMode ? (
          <section className="chapter">
            <h2 className="type-heading type-h2 text-ink">{copy.ownerMode}</h2>
            <p className="measure mt-2 text-ink-soft">{copy.ownerModeBody}</p>
            <Link href="/owner" className="btn-quiet mt-4">
              {copy.goToMyBerth}
            </Link>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function AccountContent() {
  return (
    <RoleGate>
      <AccountBody />
    </RoleGate>
  );
}
