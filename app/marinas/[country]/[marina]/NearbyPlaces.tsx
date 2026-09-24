import type { Marina } from "../../../../data/marinas";
import Disclosure from "../../../components/Disclosure";

// A compact list of place names. Each opens to its one-line description.
export default function NearbyPlaces({ marina }: { marina: Marina }) {
  if (marina.nearby.length === 0) return null;
  return (
    <div className="hairline-top mt-12 pt-8">
      <h3 className="type-heading type-h3 text-ink">What&apos;s nearby</h3>
      <ul className="mt-4 max-w-2xl">
        {marina.nearby.map((place) => (
          <li key={place.name}>
            <Disclosure variant="row" label={place.name}>
              <p className="pb-4 text-ink/75">{place.description}</p>
            </Disclosure>
          </li>
        ))}
      </ul>
    </div>
  );
}
