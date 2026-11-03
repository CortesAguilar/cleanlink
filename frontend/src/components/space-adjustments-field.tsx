import type { AdjustmentsDraft } from '../data/tenant-form';
import type { SpaceType } from '../types/tenant';
import { TextField } from './text-field';

type SpaceAdjustmentsFieldProps = {
  spaceTypes: SpaceType[];
  value: AdjustmentsDraft;
  onChange: (value: AdjustmentsDraft) => void;
  error?: string;
};

/**
 * Ajuste del precio por tipo de espacio. 1.0 = sin ajuste; 1.1 = 10 % más caro.
 * Cotización = precio por m² × m² × ajuste del tipo de espacio.
 */
export function SpaceAdjustmentsField({ spaceTypes, value, onChange, error }: SpaceAdjustmentsFieldProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
      <legend className="mb-2 text-label">Ajuste por tipo de espacio</legend>
      <p className="text-body-sm text-ink-muted">
        1.0 deja el precio igual; 1.2 lo sube 20 %. Cambia solo los que quieras.
      </p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {spaceTypes.map((type) => (
          <TextField
            key={type.id}
            label={type.label}
            type="number"
            inputMode="decimal"
            min="0.1"
            max="10"
            step="0.05"
            value={value[type.id] ?? '1'}
            onChange={(e) => onChange({ ...value, [type.id]: e.target.value })}
          />
        ))}
      </div>
      {error && <p className="text-caption text-danger">{error}</p>}
    </fieldset>
  );
}
