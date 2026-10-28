// DEV ONLY. The sample accounts the dev switcher signs in as: real users that
// supabase/seed.sql creates (with the password below) on a development
// project. Never run that seed on a project with real people in it, and leave
// NEXT_PUBLIC_ENABLE_DEV_TOOLS unset for anything real: the password is public.

export const DEV_PASSWORD = "aldock-dev-only";

export type SeededPersona = {
  id: string;
  email: string;
  label: string;
  description: string;
};

export const SEEDED_PERSONAS: SeededPersona[] = [
  {
    id: "voyager",
    email: "alex.morgan@example.com",
    label: "Guest",
    description: "Has a boat and three arrival requests",
  },
  {
    id: "owner",
    email: "jordan.reyes@example.com",
    label: "Guest and berth holder",
    description: "Holds berth G-14, sees the mode switch",
  },
  {
    id: "staff",
    email: "sam.okafor@example.com",
    label: "Marina staff",
    description: "Staff of Marina de Cascais",
  },
];
