import type { TeamDraft } from '../data/tenant-form';
import type { ProviderKind } from '../types/provider';
import { TextField } from './text-field';

type TeamSizeFieldProps = {
  kind: ProviderKind;
  value: TeamDraft;
  onChange: (value: TeamDraft) => void;
  error?: string;
};

/**
 * Personas que trabajan: persona = 1 (no se pide), equipo = número fijo,
 * empresa = rango mínimo y máximo. Sirve para que el cliente descarte a quien no le alcanza.
 */
export function TeamSizeField({ kind, value, onChange, error }: TeamSizeFieldProps) {
  if (kind === 'persona') {
    return <p className="text-body-sm text-ink-muted">Como persona trabajas por tu cuenta: 1 persona.</p>;
  }

  if (kind === 'equipo') {
    return (
      <div className="w-56">
        <TextField
          label="Personas en el equipo"
          type="number"
          inputMode="numeric"
          min="2"
          required
          value={value.teamSize}
          error={error}
          onChange={(e) => onChange({ ...value, teamSize: e.target.value })}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-4">
        <div className="w-40">
          <TextField
            label="Personas (mínimo)"
            type="number"
            inputMode="numeric"
            min="1"
            required
            value={value.teamMin}
            onChange={(e) => onChange({ ...value, teamMin: e.target.value })}
          />
        </div>
        <div className="w-40">
          <TextField
            label="Personas (máximo)"
            type="number"
            inputMode="numeric"
            min="1"
            required
            value={value.teamMax}
            onChange={(e) => onChange({ ...value, teamMax: e.target.value })}
          />
        </div>
      </div>
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
}
