import type { HTMLAttributes, ReactNode } from 'react';

type CardPadding = 'sm' | 'md' | 'lg';
type CardElevation = 'flat' | 'floating';
type CardTone = 'raised' | 'tint';

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'article' | 'section' | 'aside' | 'a';
  /** Solo cuando as="a". */
  href?: string;
  padding?: CardPadding;
  elevation?: CardElevation;
  tone?: CardTone;
  /** md (6px) para tarjetas compactas en listados; lg (8px) para perfiles, modales y bloques. */
  radius?: 'md' | 'lg';
  children: ReactNode;
};

const paddings: Record<CardPadding, string> = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-8',
};

const elevations: Record<CardElevation, string> = {
  flat: '',
  floating: 'shadow-md',
};

const tones: Record<CardTone, string> = {
  raised: 'bg-surface-raised border border-line',
  tint: 'bg-surface-tint',
};

/**
 * Contenedor base de tarjetas, paneles y formularios.
 * - padding: sm (16px), md (20px), lg (32px).
 * - elevation: flat (solo borde, lo normal) o floating (shadow-md, solo modales y lo que flota).
 * - tone: raised (blanco) o tint (aqua muy claro, para banners).
 * - radius: md (6px) o lg (8px).
 * - as: etiqueta HTML. Las tarjetas que son enlaces marcan el borde en primary al pasar el cursor.
 */
export function Card({
  as: Tag = 'div',
  padding = 'md',
  elevation = 'flat',
  tone = 'raised',
  radius = 'lg',
  className = '',
  children,
  ...rest
}: CardProps) {
  const classes = [
    'flex flex-col gap-4 text-ink no-underline',
    radius === 'md' ? 'rounded-md' : 'rounded-lg',
    paddings[padding],
    elevations[elevation],
    tones[tone],
    Tag === 'a' ? 'transition-colors hover:border-primary' : '',
    className,
  ].join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
