import type { Marina } from "../../../../data/marinas";

export default function NearbyPlaces({ marina }: { marina: Marina }) {
  if (marina.nearby.length === 0) return null;
  return (
    <section className="section px-5 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="type-heading type-h2 text-ink">What&apos;s nearby</h2>
        <ul className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {marina.nearby.map((place) => (
            <li key={place.name}>
              <h3 className="type-heading type-h3 text-ink">{place.name}</h3>
              <p className="mt-1 text-ink/75">{place.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
