"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Footer from "./Footer";

const Navbar = dynamic(() => import("./Navbar"));

// The consumer navbar and footer wrap every page except /staff/*, which has
// its own shell and navigation (see app/staff/layout.tsx), separate from the
// consumer app.
export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/staff")) {
    return <>{children}</>;
  }
  return (
    <>
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
