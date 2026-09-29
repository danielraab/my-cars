import { useQuery } from '@tanstack/react-query'

import { allCarsQueryOptions } from '#/cars/queries'

// A filter over the caller's cars. It is controlled: the route owns the
// selection (usually in its search) and "all cars" is reported as undefined.
export function CarSelect({
  id,
  label,
  allLabel,
  value,
  onChange,
}: {
  id: string
  label: string
  allLabel: string
  value: string | undefined
  onChange: (carId: string | undefined) => void
}) {
  const cars = useQuery(allCarsQueryOptions)

  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <select
          id={id}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value || undefined)}
        >
          <option value="">{allLabel}</option>
          {cars.data?.items.map((car) => (
            <option key={car.id} value={car.id}>
              {car.make} {car.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
