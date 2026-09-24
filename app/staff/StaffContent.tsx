"use client";

import { useMemo } from "react";
import { siteConfig } from "../../data/site";
import { getStaffMemberships } from "../../lib/mockData";
import { useAuth } from "../components/AuthProvider";
import RoleGate from "../components/RoleGate";

function StaffBody() {
  const { user } = useAuth();
  const memberships = useMemo(
    () => getStaffMemberships(user?.id ?? null),
    [user?.id]
  );

  return (
    <div className="section px-5 md:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="type-display [font-size:clamp(2rem,1.2rem+3vw,3.2rem)] text-ink">
          Staff area
        </h1>
        {memberships.map((m) => (
          <p key={m.marinaId} className="measure mt-4 text-lg text-ink/75">
            Signed in as staff of {m.marinaName}.
          </p>
        ))}
        <p className="measure mt-4 text-ink/75">
          {siteConfig.accounts.staffPlaceholder}
        </p>
        {siteConfig.mockMode ? (
          <p className="mt-2 text-sm text-ink/70">{siteConfig.accounts.mockNote}</p>
        ) : null}
      </div>
    </div>
  );
}

export default function StaffContent() {
  return (
    <RoleGate role="staff">
      <StaffBody />
    </RoleGate>
  );
}
