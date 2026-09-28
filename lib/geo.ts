export function formatCoordinates(lat: number, lng: number): string {
  const latLabel = lat >= 0 ? "N" : "S";
  const lngLabel = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}° ${latLabel}, ${Math.abs(lng).toFixed(3)}° ${lngLabel}`;
}

export function mapsUrlForCoordinates(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
