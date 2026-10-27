// The account page (demo): profile, roles and the owner-mode pointer.
export const account = {
  title: "Account",
  signedInAs: (name: string) => `Signed in as ${name}.`,
  mockNote: "Demo: this is sample data and nothing is saved to a server.",
  profile: "Profile",
  name: "Name",
  email: "Email",
  phone: "Phone",
  save: "Save changes",
  errName: "Enter your name.",
  errEmail: "Enter an email address like name@example.com.",
  saved: "Saved on this device.",
  saveFailed: "Could not save. Your browser is blocking storage.",
  skipperNote: "The skipper details used to fill your enquiries are kept separately in",
  roles: "Your roles",
  roleCopy: {
    voyager: {
      title: "Guest",
      how: "You signed up as a guest. This is the default for everyone.",
    },
    owner: {
      title: "Berth holder",
      how: "Granted because a marina linked a berth to you. It cannot be added or removed from here.",
    },
    staff: {
      title: "Marina staff",
      how: "Granted because a marina invited you and you accepted. It cannot be added or removed from here.",
    },
  },
  howRolesWork: "How roles work",
  rules: [
    "Anyone can sign up as a guest.",
    "Berth holder is granted only when a marina links a berth to you.",
    "Staff is granted only when a marina invites you and you accept.",
  ],
  ownerMode: "Berth holder mode",
  ownerModeBody:
    "Use the Guest and Berth holder switch at the bottom left to move between booking as a guest and managing your berth.",
  goToMyBerth: "Go to My berth",
};
