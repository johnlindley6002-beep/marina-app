import type { ReactElement } from "react";
import type { FacilityKey } from "../../../../data/marinas";

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

function ShowersLaundryIcon({ className }: IconProps) {
  return (
    <svg {...sharedProps} className={className}>
      <circle cx="12" cy="13" r="6" />
      <path d="M9 13a3 3 0 0 0 6 0" />
      <path d="M8 4h8" />
      <path d="M12 4v3" />
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

const FACILITY_ICONS: Record<
  FacilityKey,
  (props: IconProps) => ReactElement
> = {
  fuel: FuelIcon,
  water: WaterIcon,
  power: PowerIcon,
  travelLift: TravelLiftIcon,
  security24h: Security24hIcon,
  showersLaundry: ShowersLaundryIcon,
  repairs: RepairsIcon,
  dryStorage: DryStorageIcon,
};

export default function FacilityIcon({
  facility,
  className = "h-6 w-6",
}: {
  facility: FacilityKey;
  className?: string;
}) {
  const Icon = FACILITY_ICONS[facility];
  return <Icon className={className} />;
}
