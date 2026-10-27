import type { InputHTMLAttributes, ReactNode } from 'react';

type CheckProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode;
  type?: 'checkbox' | 'radio';
};

/** Casilla o botón de opción con su etiqueta. */
export function Check({ label, type = 'checkbox', ...rest }: CheckProps) {
  return (
    <label className="flex min-h-6 cursor-pointer items-center gap-2 text-body-sm">
      <input type={type} className="m-0 size-4.5 cursor-pointer accent-primary" {...rest} />
      {label}
    </label>
  );
}
