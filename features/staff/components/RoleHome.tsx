"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ROLE_HOME } from "../lib/roles";
import { useStaffSession } from "./StaffSessionProvider";

// /staff sends each role to its own start screen.
export default function RoleHome() {
  const { session, ready } = useStaffSession();
  const router = useRouter();
  useEffect(() => {
    if (ready && session?.role) router.replace(ROLE_HOME[session.role]);
  }, [ready, session, router]);
  return <div className="min-h-[24rem]" aria-hidden="true" />;
}
