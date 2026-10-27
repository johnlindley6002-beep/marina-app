// The staff sign-in page and the back office's access messages.
export const staffLogin = {
  title: "Staff sign-in",
  intro:
    "Enter your work email and we will send you a sign-in link. Staff accounts are created by invitation from your marina.",
  email: "Work email",
  send: "Send sign-in link",
  sending: "Sending",
  errEmail: "Enter an email address like name@example.com.",
  sent: (email: string) =>
    `If ${email} belongs to a staff account, a sign-in link is on its way. Open it on this device. It works once.`,
  tooMany: "Too many links were requested. Wait a minute and try again.",
  failed: "Could not send the link. Check your connection and try again.",
  linkFailed:
    "That sign-in link did not work. It may have expired or been used already. Ask for a new one below.",
  notStaffTitle: "No staff access",
  notStaff: (email: string) =>
    `${email} is signed in but is not staff of any marina. Ask your marina's admin for an invitation.`,
  signOut: "Sign out",
  signedInAs: (email: string) => `Signed in as ${email}`,
};
