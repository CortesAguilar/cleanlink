import { useId, type TextareaHTMLAttributes } from 'react';
import { FieldShell } from './field-shell';
import { fieldA11yProps, fieldControlClasses, type FieldProps } from './field-utils';

type TextAreaProps = FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'>;

/** Campo de texto de varias líneas (descripciones, mensajes). */
export function TextArea({ label, optional, hint, error, rows = 4, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} optional={optional} hint={hint} error={error}>
      <textarea
        rows={rows}
        className={`${fieldControlClasses} resize-y py-3`}
        {...fieldA11yProps(id, { hint, error })}
        {...rest}
      />
    </FieldShell>
  );
}
