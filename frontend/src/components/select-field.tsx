import { useId, type SelectHTMLAttributes } from 'react';
import { FieldShell } from './field-shell';
import { fieldA11yProps, fieldControlClasses, type FieldProps } from './field-utils';

export type SelectOption = string | { value: string; label: string };

type SelectFieldProps = FieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & {
    options: SelectOption[];
  };

/** Lista desplegable. `options` es un arreglo de strings o de { value, label }. */
export function SelectField({ label, optional, hint, error, options, ...rest }: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <select className={`${fieldControlClasses} px-3`} {...fieldA11yProps(id, { hint, error })} {...rest}>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const text = typeof option === 'string' ? option : option.label;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </FieldShell>
  );
}
