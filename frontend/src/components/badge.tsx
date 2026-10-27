import type { ReactNode } from 'react';
import { Icon } from './icon';

export type BadgeTone = 'persona' | 'grupo' | 'success' | 'warning' | 'danger' | 'neutral';

type BadgeProps = {
  tone?: BadgeTone;
  icon?: string;
  children: ReactNode;
};

const tones: Record<BadgeTone, string> = {
  persona: 'bg-primary-soft text-on-primary-soft',
  grupo: 'bg-secondary-soft text-on-secondary-soft',
  success: 'bg-success text-on-success',
  warning: 'bg-warning text-on-warning',
  danger: 'bg-danger text-on-danger',
  neutral: 'border-line text-ink font-medium',
};

/**
 * Etiqueta pequeña de solo lectura.
 * - tone: persona, grupo, success, warning, danger, neutral (borde, para servicios).
 * Persona vs. Grupo nunca se distingue solo por color: el badge siempre lleva texto.
 */
export function Badge({ tone = 'neutral', icon, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-transparent px-2.5 py-1 text-caption font-semibold whitespace-nowrap ${tones[tone]}`}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  );
}
