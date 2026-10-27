/** Clases compartidas por input, textarea y select. */
export const fieldControlClasses =
  'w-full min-h-12 rounded-md border border-line bg-surface-raised px-4 text-body text-ink placeholder:text-ink-muted hover:border-ink-muted aria-invalid:border-danger';

/** Props comunes a todos los campos de formulario. */
export type FieldProps = {
  label: string;
  /** Agrega "(opcional)" junto a la etiqueta. */
  optional?: boolean;
  hint?: string;
  error?: string;
};

/** Props de accesibilidad que el control debe recibir para enlazar hint y error. */
export function fieldA11yProps(id: string, { hint, error }: Pick<FieldProps, 'hint' | 'error'>) {
  return {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error || hint ? `${id}-msg` : undefined,
  };
}
