import type { ReactElement } from "react";
import type { FacilityIconKey } from "../../../../data/marinas";

type IconProps = {
  className?: string;
};

const sharedProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function FuelIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M5 20V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v14" />
      <path d="M5 20h7" />
      <path d="M13 10h2.5L18 12.5V17a1.5 1.5 0 0 1-3 0v-1" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
  );
}

function WaterIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11Z" />
    </svg>
  );
}

function PowerIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M12 3 5 13h5l-1 8 8-11h-5l1-7Z" />
    </svg>
  );
}

function TravelLiftIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M4 8h16" />
      <path d="M6 8V5h12v3" />
      <path d="M8 8v6a4 4 0 0 0 8 0V8" />
      <path d="M12 18v2" />
    </svg>
  );
}

function Security24hIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" />
      <path d="M9.5 12h1.6l1 3 1-6 1 3h1.4" />
    </svg>
  );
}

function LaundryIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="12" cy="13" r="4.5" />
      <path d="M9.5 13a2.5 2.5 0 0 0 5 0" />
      <circle cx="7.5" cy="6.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CraneIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M5 21V6l11-3v4" />
      <path d="M16 7h4" />
      <path d="M18 7v5" />
      <path d="M18 12l2 3" />
      <path d="M5 15h6" />
    </svg>
  );
}

function PumpOutIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <circle cx="10" cy="14" r="6" />
      <path d="M10 10v8M7 14h6" />
      <path d="M15 10l5-5" />
      <path d="M16.5 5h3.5v3.5" />
    </svg>
  );
}

function WifiIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M4 9.5a13 13 0 0 1 16 0" />
      <path d="M7 13a8.5 8.5 0 0 1 10 0" />
      <path d="M10 16.5a4 4 0 0 1 4 0" />
      <circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function RepairsIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M14.5 6.5a3 3 0 0 1-3.8 3.8L6 15v3h3l4.7-4.7a3 3 0 0 1 3.8-3.8L15 12l-2-2 1.5-1.5Z" />
    </svg>
  );
}

function DryStorageIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M4 8l8-4 8 4-8 4-8-4Z" />
      <path d="M4 8v8l8 4 8-4V8" />
      <path d="M12 12v8" />
    </svg>
  );
}

function ReceptionIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M3 18h18" />
      <path d="M5 18a7 7 0 0 1 14 0" />
      <path d="M12 8V6" />
      <path d="M10 6h4" />
    </svg>
  );
}

function ShowersIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M4 20V8a4 4 0 0 1 4-4h2" />
      <path d="M10 4a6 6 0 0 1 6 6H8a6 6 0 0 1 2-6Z" />
      <path d="M10 14v1M13 14v1M16 14v1M11.5 18v1M14.5 18v1" />
    </svg>
  );
}

function HeliportIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 8v8M14.5 8v8M9.5 12h5" />
    </svg>
  );
}

function WasteIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M5 7h14" />
      <path d="M9 7V4h6v3" />
      <path d="M6.5 7l1 13h9l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function ExtrasIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </svg>
  );
}

const FACILITY_ICONS: Record<
  FacilityIconKey,
  (props: IconProps) => ReactElement
> = {
  fuel: FuelIcon,
  water: WaterIcon,
  power: PowerIcon,
  travelLift: TravelLiftIcon,
  crane: CraneIcon,
  pumpOut: PumpOutIcon,
  laundry: LaundryIcon,
  security24h: Security24hIcon,
  wifi: WifiIcon,
  dryStorage: DryStorageIcon,
  repairs: RepairsIcon,
  reception: ReceptionIcon,
  showers: ShowersIcon,
  heliport: HeliportIcon,
  waste: WasteIcon,
  extras: ExtrasIcon,
};

export default function FacilityIcon({
  facility,
  className = "h-6 w-6",
}: {
  facility: FacilityIconKey;
  className?: string;
}) {
  const Icon = FACILITY_ICONS[facility];
  return <Icon className={className} />;
}
