// Text shared across the app shell: skip link, navigation labels, the account
// menu, the sign-in gate, sharing and the marina filters.
export const chrome = {
  skipToContent: "Skip to content",
  privacyNote:
    "aldock has no accounts. Boat details, saved marinas and your last enquiry are stored only in this browser. When you send an enquiry, your own email app sends it straight to the marina and aldock does not receive a copy. Passport numbers and other private details are optional and can be given to staff in person.",
  nav: {
    main: "Main",
    breadcrumb: "Breadcrumb",
    footer: "Footer",
    ownerHome: "My berth",
  },
  account: {
    account: "Account",
    staffArea: "Staff area",
    signOut: "Sign out",
    menuFor: (name: string) => `Account menu for ${name}`,
  },
  mode: { label: "Mode", guest: "Guest", owner: "Berth holder" },
  gate: {
    back: "Back to marinas",
    signInTitle: "Sign in to continue",
    signedOutDemo:
      "You are not signed in. This is a demo, so use the switcher at the bottom left to sign in as a sample account.",
    notAvailable: "You are not signed in. Sign-in is not available in this preview.",
    ownerTitle: "Berth holder mode is not available",
    ownerLocked:
      "Berth holder mode is available when a marina links your berth to your account. You cannot add it yourself.",
    staffTitle: "Staff area",
    staffLocked:
      "The staff area is for marina staff who have accepted an invitation from their marina.",
  },
  share: {
    share: "Share",
    copied: "Link copied",
    failed: "Could not copy. Copy the address from your browser bar.",
  },
  discovery: {
    region: "Region",
    any: "Any",
    priceBand: "Price band",
    boatLength: (unit: string) => `Boat length (${unit})`,
    facilities: "Facilities",
    noMatch: "No marinas match these filters. Try loosening them.",
    protection: "Protection",
    startEnquiry: "Start an enquiry",
    remove: "Remove",
  },
};
