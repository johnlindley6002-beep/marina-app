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
    label: "Director",
    description: "Sam, director of Marina de Cascais: everything",
  },
  {
    id: "dockmaster",
    email: "teresa.marques@example.com",
    label: "Dockmaster",
    description: "Teresa: day plan, berths, relets, the dock team",
  },
  {
    id: "reception",
    email: "ines.duarte@example.com",
    label: "Reception",
    description: "Ines: arrivals, check-in, customers, radio log",
  },
  {
    id: "team-lead",
    email: "rui.costa@example.com",
    label: "Marinheiro, team lead",
    description: "Rui: claims jobs and may assign them",
  },
  {
    id: "marinheiro",
    email: "bruno.lima@example.com",
    label: "Marinheiro",
    description: "Bruno: my next job, my day, my shifts",
  },
  {
    id: "night-watch",
    email: "hugo.pinto@example.com",
    label: "Night watch",
    description: "Hugo: tonight, late check-in, incidents",
  },
  {
    id: "seasonal",
    email: "diogo.alves@example.com",
    label: "Seasonal, access ended",
    description: "Diogo: access ended three days ago, sees nothing",
  },
];
