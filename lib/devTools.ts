// Developer tools (the persona switcher that signs in as a sample owner or
// staff member, and the scenario loader page) exist only while developing.
//
// A production build hides them unless NEXT_PUBLIC_ENABLE_DEV_TOOLS=1 is set at
// build time. That switch is for a demo deployment of this mock-only site, where
// there is no real sign-in yet and the staff and owner areas could not be
// reached otherwise. Leave it unset for anything real.
export const DEV_TOOLS_ENABLED =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "1";
