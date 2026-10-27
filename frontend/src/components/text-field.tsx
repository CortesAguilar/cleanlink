import { useId, type InputHTMLAttributes } from 'react';
import { FieldShell } from './field-shell';
import { fieldA11yProps, fieldControlClasses, type FieldProps } from './field-utils';
import { Icon } from './icon';

type TextFieldProps = FieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
    /** Icono a la izquierda del texto. */
    icon?: string;
  };

/** Campo de texto de una línea. Para texto largo usa TextArea. */
export function TextField({ label, optional, hint, error, icon, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <div className="relative flex items-center">
        {icon && <Icon name={icon} size={20} className="pointer-events-none absolute left-3 text-ink-muted" />}
        <input
          className={`${fieldControlClasses} ${icon ? 'pl-10' : ''}`}
          {...fieldA11yProps(id, { hint, error })}
          {...rest}
        />
      </div>
    </FieldShell>
  );
}
