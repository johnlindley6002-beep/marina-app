// Integration point for the marinas-results map (to be supplied by the owner).
// Set MARINAS_MAP_READY to true and render the map here; the results view
// lays itself out around it and keeps the list and pins in sync through
// highlightedId / onHover.
export const MARINAS_MAP_READY = false;

export type MapPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  href: string;
};

type Props = {
  pins: MapPin[];
  highlightedId: string | null;
  onHover: (id: string | null) => void;
};

export default function MarinasMap(props: Props) {
  void props;
  return null;
}
