// Site-level configuration. Set heroImage when a photo is supplied; until
// then the homepage hero renders as an ink gradient with chart linework.
export const siteConfig: {
  heroImage: { src: string; alt: string } | null;
  // TODO(owner): replace these placeholder company contact details.
  contact: { email: string; phone: string };
} = {
  heroImage: null,
  contact: { email: "hello@aldock.com", phone: "+1 (555) 123-4567" },
};
