import type { ReactNode } from 'react';
import type { FieldProps } from './field-utils';

type FieldShellProps = FieldProps & {
  id: string;
  children: ReactNode;
};

/**
 * Envoltura común de los campos de formulario: etiqueta, control, ayuda y error.
 * El control debe recibir `fieldA11yProps(id, { hint, error })`.
 */
export function FieldShell({ id, label, optional, hint, error, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label">
        {label}
        {optional && <span className="font-normal text-ink-muted"> (opcional)</span>}
      </label>
      {children}
      {error ? (
        <span id={`${id}-msg`} className="text-caption text-danger">
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${id}-msg`} className="text-caption font-normal text-ink-muted">
            {hint}
          </span>
        )
      )}
    </div>
  );
}
