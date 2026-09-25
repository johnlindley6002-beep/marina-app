"use client";

import { useMemo } from "react";
import { siteConfig } from "../../data/site";
import { getStaffMemberships } from "../../lib/mockData";
import { useAuth } from "../components/AuthProvider";
import PageHeader from "../components/PageHeader";
import RoleGate from "../components/RoleGate";
import RelettingQueue from "./RelettingQueue";

function StaffBody() {
  const { user } = useAuth();
  const memberships = useMemo(
    () => getStaffMemberships(user?.id ?? null),
    [user?.id]
  );

  return (
    <div className="section">
      <div className="page-column page-reading">
        <PageHeader title="Staff area" mock>
          {memberships.map((m) => (
            <p key={m.marinaId}>Signed in as staff of {m.marinaName}.</p>
          ))}
        </PageHeader>
        <RelettingQueue />
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
