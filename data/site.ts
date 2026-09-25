// Copy for the owner's reletting flow. All of it is plain-language and English
// only for now. TODO (legal): have the "why" and footer wording reviewed.
export type ReletCopy = {
  useRight: string;
  primaryAction: string;
  placeholderNote: string;
  steps: string[];
  absenceTitle: string;
  absenceBody: string;
  absenceConfirm: string;
  authorizeTitle: string;
  authorizeToggle: string;
  authorizeLine: string;
  authorizeWhyLabel: string;
  authorizeWhy: string;
  termsTitle: string;
  termsAccept: string;
  taxLabel: string;
  readinessTitle: string;
  readinessBoat: string;
  readinessBerth: string;
  readinessInsurance: string;
  submitTitle: string;
  submitAction: string;
  pendingTitle: string;
  pendingBody: string;
  legalFooter: string;
  queueIntro: string;
  firstTimeTitle: string;
  firstTimeBody: string;
  lockedNote: string;
  estimateNote: string;
  resumeBanner: string;
  editTitle: string;
  resubmitTitle: string;
  cancelConfirm: string;
  notApprovedLead: string;
};

// Site-level configuration. Set heroImage when a photo is supplied; until
// then the homepage hero renders as an ink gradient with chart linework.
export const siteConfig: {
  heroImage: { src: string; alt: string } | null;
  // A full-bleed resting band on the homepage, between the featured marina and
  // About. No text goes over it. Leave null until a photo is supplied.
  bandImage: { src: string; alt: string } | null;
  // TODO(owner): replace these placeholder company contact details.
  contact: { email: string; phone: string };
  // The Google reviews block is hidden until a marina has at least this many.
  googleReviewsMinCount: number;
  // Short, plain description of how the site handles data. Have it checked
  // before launch.
  privacyNote: string;
  relet: ReletCopy;
  // MOCK: shows the dev sign-in switcher and "sample data" notes. Set to false
  // to hide the switcher. Delete the mock layer when a real backend arrives.
  mockMode: boolean;
  // Copy for the account, owner and staff screens (all mock for now).
  accounts: {
    mockNote: string;
    signedOut: string;
    ownerLocked: string;
    staffLocked: string;
    roleCopy: Record<"voyager" | "owner" | "staff", { title: string; how: string }>;
    rules: string[];
    awayDatesPlaceholder: string;
    staffPlaceholder: string;
  };
  // Copy for the at-a-glance summary in Plan your stay.
  decision: { availabilityNote: string; requestNote: string };
  // Copy for the My boat area.
  hub: {
    intro: string;
    deviceNote: string;
    documentsNote: string;
    clearWarning: string;
  };
} = {
  heroImage: null,
  bandImage: null,
  contact: { email: "hello@aldock.com", phone: "+1 (555) 123-4567" },
  googleReviewsMinCount: 15,
  privacyNote:
    "aldock has no accounts. Boat details, saved marinas and your last enquiry are stored only in this browser. When you send an enquiry, your own email app sends it straight to the marina and aldock does not receive a copy. Passport numbers and other private details are optional and can be given to staff in person.",
  mockMode: true,
  relet: {
    useRight:
      "You hold a right of use of this berth. It is not ownership, and it can be relet only with the marina's consent.",
    primaryAction: "Make my berth available while I am away",
    placeholderNote:
      "Placeholder terms for the mockup. The marina sets the final amounts.",
    steps: ["Absence", "Authorize", "Terms", "Readiness", "Send"],
    absenceTitle: "When will you be away?",
    absenceBody: "Choose the day you leave and the day you return.",
    absenceConfirm: "My boat will be removed from the berth for these dates.",
    authorizeTitle: "Let the marina relet your berth",
    authorizeToggle:
      "Allow Marina de Cascais to relet my berth during my absence",
    authorizeLine:
      "Your berth is a right of use, so it can be relet only with the marina's consent. The marina manages and approves every stay.",
    authorizeWhyLabel: "Why this",
    authorizeWhy:
      "This is not a sublet between you and a visitor. The berth stays under your right of use. The marina, not you, decides whether to relet it, finds and checks the visitor, and handles their formalities. Nothing is relet until the marina approves your request.",
    termsTitle: "The terms",
    termsAccept: "I accept the reletting terms",
    taxLabel: "About tax",
    readinessTitle: "Before you go",
    readinessBoat: "My boat will be removed from the berth by the start date.",
    readinessBerth: "The berth will be cleared of lines, fenders and belongings.",
    readinessInsurance:
      "Your own insurance stays valid for your berth. The visitor's insurance is the marina's responsibility at check-in.",
    submitTitle: "Send your request",
    submitAction: "Send request to the marina",
    pendingTitle: "Pending marina approval",
    pendingBody:
      "The marina reviews every request before anything is relet. You will see the update in Updates on My berth.",
    legalFooter:
      "Your berth is a right of use of public maritime domain, held under a State concession. It can be relet only with the marina's prior consent, and the marina handles the visitor's formalities. Your details are processed only with your consent (GDPR). Any credit may be taxable. Consumer disputes can go to consumer arbitration.",
    queueIntro:
      "Berth holders ask for your consent before their berth is relet. Approve or decline each request.",
    firstTimeTitle: "Let your berth work while you are away",
    firstTimeBody:
      "When you are away, the marina can relet your berth to a visiting boat and you earn a credit. Nothing happens without the marina's approval, and you choose the dates.",
    lockedNote:
      "A visitor has booked some of these nights, so this can no longer be changed or cancelled here. Please contact the marina.",
    estimateNote:
      "The marina may relet only some of your nights, and you are credited for the nights actually booked.",
    resumeBanner: "You are continuing where you left off.",
    editTitle: "Change your dates",
    resubmitTitle: "Adjust and send again",
    cancelConfirm: "Cancel this request? The marina will no longer consider it.",
    notApprovedLead: "The marina did not approve this request.",
  },
  accounts: {
    mockNote: "Mockup: this is sample data and nothing is saved to a server.",
    signedOut:
      "You are not signed in. This is a mockup, so use the switcher at the bottom left to sign in as a sample account.",
    ownerLocked:
      "Owner mode is available when a marina links your berth to your account. You cannot add it yourself.",
    staffLocked:
      "The staff area is for marina staff who have accepted an invitation from their marina.",
    roleCopy: {
      voyager: {
        title: "Voyager",
        how: "You signed up as a voyager. This is the default for everyone.",
      },
      owner: {
        title: "Owner",
        how: "Granted because a marina linked a berth to you. It cannot be added or removed from here.",
      },
      staff: {
        title: "Marina staff",
        how: "Granted because a marina invited you and you accepted. It cannot be added or removed from here.",
      },
    },
    rules: [
      "Anyone can sign up as a voyager.",
      "Owner is granted only when a marina links a berth to you.",
      "Staff is granted only when a marina invites you and you accept.",
    ],
    awayDatesPlaceholder:
      "Planned for the next step. You will be able to mark the dates you are away so the marina can relet your berth.",
    staffPlaceholder:
      "The staff tools are built in the next step. This page is the shell they will live in.",
  },
  decision: {
    availabilityNote:
      "Illustrative, not live. The marina confirms availability by email.",
    requestNote:
      "This sends an enquiry; the marina confirms availability by email.",
  },
  hub: {
    intro:
      "Save your boat once and every form on aldock fills itself in. Everything here is kept on this device only.",
    deviceNote:
      "Nothing is sent anywhere until you choose to send an enquiry by email. Clearing your browser data removes what you save here.",
    documentsNote:
      "These are notes only, not uploads. The physical documents must still be shown on arrival.",
    clearWarning:
      "This removes your boats, documents, skipper details, saved marinas and last enquiry from this device. Your units and language choices are kept.",
  },
};
