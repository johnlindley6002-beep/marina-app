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
} = {
  heroImage: null,
  contact: { email: "hello@aldock.com", phone: "+1 (555) 123-4567" },
  googleReviewsMinCount: 15,
  privacyNote:
    "aldock has no accounts. Boat details, saved marinas and your last enquiry are stored only in this browser. When you send an enquiry, your own email app sends it straight to the marina and aldock does not receive a copy. Passport numbers and other private details are optional and can be given to staff in person.",
};
