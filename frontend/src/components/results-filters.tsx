import { services, zones } from '../data/services';
import type { ServiceId } from '../types/provider';
import { Check } from './check';
import { SelectField } from './select-field';

export type ResultsFiltersValue = {
  services: ServiceId[];
  /** Cadena vacía = toda Tijuana. */
  zone: string;
  minRating: number;
  verifiedOnly: boolean;
};

type ResultsFiltersProps = {
  value: ResultsFiltersValue;
  onChange: (next: ResultsFiltersValue) => void;
};

/** Panel lateral de filtros de la pantalla de resultados. */
export function ResultsFilters({ value, onChange }: ResultsFiltersProps) {
  function toggleService(id: ServiceId) {
    const selected = value.services.includes(id)
      ? value.services.filter((s) => s !== id)
      : [...value.services, id];
    onChange({ ...value, services: selected });
  }

  return (
    <aside
      aria-label="Filtros"
      className="flex flex-col gap-6 rounded-lg border border-line bg-surface-raised p-5"
    >
      <h2 className="text-heading">Filtros</h2>

      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-3 text-label">Servicio</legend>
        {services.map((s) => (
          <Check
            key={s.id}
            label={s.label}
            checked={value.services.includes(s.id)}
            onChange={() => toggleService(s.id)}
          />
        ))}
      </fieldset>

      <SelectField
        label="Zona"
        value={value.zone}
        onChange={(e) => onChange({ ...value, zone: e.target.value })}
        options={[{ value: '', label: 'Toda Tijuana' }, ...zones]}
      />

      <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
        <legend className="mb-3 text-label">Calificación mínima</legend>
        <Check
          type="radio"
          name="min-rating"
          label="Cualquiera"
          checked={value.minRating === 0}
          onChange={() => onChange({ ...value, minRating: 0 })}
        />
        <Check
          type="radio"
          name="min-rating"
          label="4.5 o más"
          checked={value.minRating === 4.5}
          onChange={() => onChange({ ...value, minRating: 4.5 })}
        />
      </fieldset>

      <Check
        label={<span className="font-semibold">Solo verificados</span>}
        checked={value.verifiedOnly}
        onChange={() => onChange({ ...value, verifiedOnly: !value.verifiedOnly })}
      />
    </aside>
  );
}
