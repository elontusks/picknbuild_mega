import type { Car, IntakeFilters } from './types';

/**
 * Apply the intake-bar filters from MatchModeBar to a list of cars.
 *
 * Semantics:
 *   - make / model / year   exact match (case-insensitive for strings; numeric
 *                           year compared as String(car.year)). '' = no filter.
 *   - trim                  case-insensitive substring. '' = no filter.
 *   - mileageBucket         max-mileage threshold:
 *                              '50k'   -> car.mileage <= 50_000
 *                              '100k'  -> car.mileage <= 100_000
 *                              '150k'  -> car.mileage <= 150_000
 *                              '150k+' -> car.mileage > 150_000
 *                           '150k+' is read literally as "more than 150k" so
 *                           a shopper deliberately looking at high-mileage
 *                           inventory still gets a useful filter rather than a
 *                           no-op.
 */
export function applyIntakeFilters(cars: Car[], filters: IntakeFilters): Car[] {
  const make = filters.make.trim().toLowerCase();
  const model = filters.model.trim().toLowerCase();
  const year = filters.year.trim();
  const trim = filters.trim.trim().toLowerCase();
  const bucket = filters.mileageBucket;

  return cars.filter((car) => {
    if (make && car.make.toLowerCase() !== make) return false;
    if (model && car.model.toLowerCase() !== model) return false;
    if (year && String(car.year) !== year) return false;
    if (trim && !car.trim.toLowerCase().includes(trim)) return false;

    if (bucket === '50k' && car.mileage > 50_000) return false;
    if (bucket === '100k' && car.mileage > 100_000) return false;
    if (bucket === '150k' && car.mileage > 150_000) return false;
    if (bucket === '150k+' && car.mileage <= 150_000) return false;

    return true;
  });
}
