// Site-level configuration. Set heroImage when a photo is supplied; until
// then the homepage hero renders as an ink gradient with chart linework.
export const siteConfig: {
  heroImage: { src: string; alt: string } | null;
  // TODO(owner): replace these placeholder company contact details.
  contact: { email: string; phone: string };
  // The Google reviews block is hidden until a marina has at least this many.
  googleReviewsMinCount: number;
  // Short, plain description of how the site handles data. Have it checked
  // before launch.
  privacyNote: string;
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
  contact: { email: "hello@aldock.com", phone: "+1 (555) 123-4567" },
  googleReviewsMinCount: 15,
  privacyNote:
    "aldock has no accounts. Boat details, saved marinas and your last enquiry are stored only in this browser. When you send an enquiry, your own email app sends it straight to the marina and aldock does not receive a copy. Passport numbers and other private details are optional and can be given to staff in person.",
  mockMode: true,
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
