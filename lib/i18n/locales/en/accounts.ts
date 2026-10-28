// Signing in, the account screens, My arrivals and the arrival request. These
// are the words used when accounts are on (Supabase). The older "kept on this
// device" copy in account.ts and myBoat.ts still applies to the preview.
export const accounts = {
  gate: {
    signInTitle: "Sign in to continue",
    signInBody: "Sign in with your email to see this page.",
    signInLink: "Sign in",
  },
  privacyNote:
    "aldock keeps what you save in your account: your boats, documents and skipper details, and the requests you send to a marina. Only you and the marina you send a request to can see them. Passport numbers and other private details are optional and can be given to staff in person. Without signing in, boat details and saved marinas stay in this browser.",
  nav: {
    signIn: "Sign in",
    myArrivals: "My arrivals",
  },
  login: {
    title: "Sign in",
    intro:
      "Enter your email and we send you a link. Open it to sign in. There is no password. If you are new, the same link creates your account.",
    emailLabel: "Email",
    send: "Send me a sign-in link",
    sending: "Sending",
    errEmail: "Enter an email address like name@example.com.",
    sentTitle: "Check your email",
    sentBody: (email: string) =>
      `We sent a sign-in link to ${email}. Open it on this device. It works once and expires after one hour.`,
    useAnother: "Use a different email",
    tooMany: "Too many links were requested. Wait a minute and try again.",
    failed: "We could not send the link. Check your connection and try again.",
    linkProblem:
      "That link did not work. It may have expired or been used already. Send yourself a new one below.",
    previewNote:
      "Email sign-in is switched off in this preview. Use the Mock switcher at the bottom left to sign in as a sample account.",
    signedIn: (name: string) => `You are signed in as ${name}.`,
    continue: "Continue",
    privacy:
      "We use your email only to sign you in, and so the marina can answer your requests here.",
  },
  profile: {
    nationality: "Nationality",
    nationalityChoose: "Select a country",
    euStatus: "EU or non-EU",
    euStatusChoose: "Select",
    eu: "EU",
    nonEu: "Non-EU",
    euNote:
      "Where you live for customs and border rules. It helps the marina prepare your arrival.",
    emailFixed: "This is the email you sign in with. It cannot be changed here.",
    saved: "Saved to your account.",
    saveFailed: "Could not save to your account. Check your connection and try again.",
  },
  myBoat: {
    intro:
      "Save your boat once and every form on aldock fills itself in. Your boats, documents and skipper details are kept in your account, so they follow you to every device.",
    deviceNote:
      "Only you and the marina you send a request to can see this. Boat documents here are notes, never uploads.",
    removeQuestion: (name: string) => `Remove ${name} and its documents from your account?`,
    saved: (name: string) => `${name} saved to your account.`,
    documentsSaved: "Documents saved to your account.",
    savedOnDevice: "Saved to your account.",
    dataHeading: "Your saved data",
    clearWarning:
      "This removes your boats and documents from your account, and your saved marinas and last enquiry from this device. Your name, phone, units and language are kept.",
    clearAll: "Clear my saved boats and data",
    cleared: "Your boats and saved data were removed.",
    syncFailed:
      "Your last change could not be saved to your account. Check your connection and try again.",
    signInPrompt:
      "Sign in to keep your boats in your account and use them on any device. What you save before signing in moves into your account.",
    signInLink: "Sign in",
  },
  request: {
    intro: (marina: string) =>
      `Sends your request to ${marina}. The marina answers here, under My arrivals.`,
    note: "The marina confirms a berth for your dates and answers in My arrivals.",
    goesToMarina: "Your request goes to the marina through your account.",
    send: "Send request",
    sending: "Sending",
    signInTitle: "Sign in to send a request",
    signInBody:
      "Requests go to the marina through your account, so you can follow the answer under My arrivals.",
    signInLink: "Sign in",
    sentTitle: "Request sent",
    sentBody: (marina: string) =>
      `${marina} has your request. It shows as Requested under My arrivals until the marina answers.`,
    viewArrivals: "View my arrivals",
    emailToo: "Also email the marina",
    emailTooNote: "Optional. Your own email app sends a copy of the request.",
    summaryNote: "This is a copy of what you sent. You can also email it to the marina yourself.",
  },
  arrivals: {
    title: "My arrivals",
    intro: "Your berth requests and where each one stands. The marina answers here.",
    previewNote:
      "This preview has no account service, so requests are not stored. Sign-in and requests work on the live site.",
    empty: "You have not sent a request yet. Find a marina and request a berth.",
    findMarina: "Find a marina",
    loading: "Loading your requests",
    loadFailed: "We could not load your requests. Check your connection and try again.",
    refresh: "Try again",
    list: "Your requests",
    status: {
      requested: "Requested",
      confirmed: "Confirmed",
      declined: "Declined",
      arrived: "Arrived",
      departed: "Departed",
      dates_proposed: "Other dates offered",
    },
    help: {
      requested: "The marina has your request and will answer here.",
      confirmed: (berth: string) => `The marina confirmed your stay. Your berth is ${berth}.`,
      confirmedNoBerth: "The marina confirmed your stay and will tell you your berth on arrival.",
      declined: "The marina cannot take this request.",
      arrived: (berth: string) =>
        berth ? `You are checked in at berth ${berth}.` : "You are checked in.",
      departed: "This stay is over.",
      dates_proposed: "The marina cannot take your dates and offered other dates.",
    },
    boat: "Boat",
    stay: "Stay",
    sent: (date: string) => `Sent ${date}`,
    reason: (text: string) => `Reason: ${text}`,
    note: (text: string) => `Note from the marina: ${text}`,
    proposedTitle: "Dates the marina offered",
    accept: "Accept these dates",
    accepting: "Sending",
    accepted: "You accepted the new dates. The marina will confirm a berth.",
    openEnded: (from: string) => `From ${from}, open-ended`,
    range: (from: string, to: string) => `${from} to ${to}`,
  },
  errors: {
    not_signed_in: "Sign in to continue.",
    too_many_requests:
      "You already have five requests waiting for an answer. Wait for the marina to reply before sending another.",
    boat_not_found:
      "We could not find that boat in your account. Save it under My boat and try again.",
    invalid_dates:
      "Check your dates. The arrival cannot be in the past, and the departure cannot be before it.",
    too_many_boats: "You can keep up to 20 boats in your account.",
    no_proposal: "The marina has no other dates waiting for you.",
    not_found: "We could not find that request.",
    unknown: "Something went wrong. Check your connection and try again.",
  },
};
