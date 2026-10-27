import type { ReactNode } from 'react';

type ChipVariant = 'soft' | 'solid';

type ChipProps = {
  selected?: boolean;
  variant?: ChipVariant;
  onClick?: () => void;
  children: ReactNode;
};

const selectedStyles: Record<ChipVariant, string> = {
  soft: 'aria-pressed:bg-primary-soft aria-pressed:border-primary aria-pressed:text-on-primary-soft',
  solid: 'aria-pressed:bg-primary aria-pressed:border-primary aria-pressed:text-on-primary',
};

/**
 * Chip seleccionable (filtros, tipo de servicio, pestañas Todos/Personas/Grupos).
 * - variant: soft (seleccionado en primary-soft) o solid (seleccionado en primary).
 */
export function Chip({ selected = false, variant = 'soft', onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      className={`min-h-10 cursor-pointer rounded-full border border-line bg-surface-raised px-4 text-label text-ink transition hover:border-primary ${selectedStyles[variant]}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
