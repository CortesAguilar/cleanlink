import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Icon } from './icon';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonBaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icono a la izquierda; sin children se vuelve botón de solo icono (requiere aria-label). */
  icon?: string;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<'button'>, keyof ButtonBaseProps> & { href?: undefined };
type ButtonAsLink = ButtonBaseProps &
  Omit<ComponentPropsWithoutRef<'a'>, keyof ButtonBaseProps> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const base =
  'inline-flex items-center justify-center gap-2 rounded-md border border-transparent text-label whitespace-nowrap no-underline cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary enabled:hover:shadow-md',
  secondary: 'bg-secondary text-on-secondary enabled:hover:shadow-md',
  outline: 'bg-surface-raised border-primary text-primary enabled:hover:bg-primary-soft',
  ghost: 'bg-transparent text-ink enabled:hover:bg-surface-tint',
};

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5',
  lg: 'min-h-12 px-6',
};

const iconOnlySizes: Record<ButtonSize, string> = {
  md: 'size-11',
  lg: 'size-12',
};

/**
 * Botón del sistema.
 * - variant: primary (acción principal), secondary (acciones de Grupo),
 *   outline (acción alterna), ghost (acción discreta).
 * - size: md (44px) o lg (48px).
 * - Con `href` se renderiza como enlace.
 * - Solo icono: pasa `icon` sin children y un `aria-label` obligatorio.
 */
export function Button({ variant = 'primary', size = 'md', icon, className = '', children, ...rest }: ButtonProps) {
  const iconOnly = icon && !children;
  const classes = [
    base,
    variants[variant],
    iconOnly ? iconOnlySizes[size] : sizes[size],
    iconOnly && variant === 'ghost' ? 'border-line text-ink-muted' : '',
    className,
  ].join(' ');

  const content = (
    <>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </>
  );

  if (rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as ComponentPropsWithoutRef<'a'>)}>
        {content}
      </a>
    );
  }

  const { type = 'button', ...buttonProps } = rest as ComponentPropsWithoutRef<'button'>;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {content}
    </button>
  );
}
