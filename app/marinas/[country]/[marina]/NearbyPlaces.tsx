import type { Marina } from "../../../../data/marinas";

export default function NearbyPlaces({ marina }: { marina: Marina }) {
  if (marina.nearby.length === 0) return null;
  return (
    <div className="hairline-top mt-12 pt-8">
      <h3 className="type-heading type-h3 text-ink">What&apos;s nearby</h3>
      <ul className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {marina.nearby.map((place) => (
          <li key={place.name}>
            <h4 className="font-medium text-ink">{place.name}</h4>
            <p className="mt-1 text-ink/75">{place.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
