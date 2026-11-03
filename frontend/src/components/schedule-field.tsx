import type { ScheduleDraft } from '../data/tenant-form';
import type { Weekday } from '../types/provider';
import { Check } from './check';
import { Chip } from './chip';
import { TextField } from './text-field';

const modes: { value: ScheduleDraft['mode']; label: string }[] = [
  { value: 'siempre', label: 'Disponible siempre' },
  { value: 'definido', label: 'Días y horas definidos' },
  { value: 'sin-definir', label: 'Sin definir por ahora' },
];

const days: { value: Weekday; label: string }[] = [
  { value: 'lun', label: 'Lun' },
  { value: 'mar', label: 'Mar' },
  { value: 'mie', label: 'Mié' },
  { value: 'jue', label: 'Jue' },
  { value: 'vie', label: 'Vie' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' },
];

type ScheduleFieldProps = {
  value: ScheduleDraft;
  onChange: (value: ScheduleDraft) => void;
  error?: string;
};

/** Horario de atención: siempre, definido (días y horas) o sin definir. */
export function ScheduleField({ value, onChange, error }: ScheduleFieldProps) {
  function toggleDay(day: Weekday) {
    const next = value.days.includes(day) ? value.days.filter((d) => d !== day) : [...value.days, day];
    onChange({ ...value, days: next });
  }

  return (
    <fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
      <legend className="mb-2 text-label">Horario de atención</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {modes.map((m) => (
          <Check
            key={m.value}
            type="radio"
            name="horario"
            label={m.label}
            checked={value.mode === m.value}
            onChange={() => onChange({ ...value, mode: m.value })}
          />
        ))}
      </div>
      {value.mode === 'definido' && (
        <>
          <div role="group" aria-label="Días" className="flex flex-wrap gap-2">
            {days.map((d) => (
              <Chip key={d.value} selected={value.days.includes(d.value)} onClick={() => toggleDay(d.value)}>
                {d.label}
              </Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <TextField label="Abre" type="time" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} />
            </div>
            <div className="w-40">
              <TextField label="Cierra" type="time" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} />
            </div>
          </div>
        </>
      )}
      {error && <p className="text-caption text-danger">{error}</p>}
    </fieldset>
  );
}
