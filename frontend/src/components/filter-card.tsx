import { Icon } from './icon';

type FilterCardProps = {
  icon: string;
  label: string;
  selected?: boolean;
  onClick?: () => void;
};

/** Tarjeta seleccionable con icono y texto, para filtros principales del feed. */
export function FilterCard({ icon, label, selected = false, onClick }: FilterCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="group flex cursor-pointer flex-col items-center gap-3 rounded-lg bg-transparent p-3 text-center text-ink"
    >
      <span className="flex size-11 items-center justify-center text-ink-muted transition-colors group-hover:text-primary group-aria-pressed:text-primary">
        <Icon name={icon} size={28} />
      </span>
      <span className="text-label group-aria-pressed:text-primary md:whitespace-nowrap">{label}</span>
    </button>
  );
}
