import { useId, type ReactNode } from 'react';
import { Button } from './button';

type NavbarPopoverProps = {
  icon: string;
  /** Nombre accesible del botón y del panel. */
  label: string;
  open: boolean;
  onToggle: () => void;
  /** Contenido del botón en lugar del icono (p. ej. el avatar con iniciales). */
  trigger?: ReactNode;
  /** Ancho del panel; 300px por defecto. */
  panelClassName?: string;
  children: ReactNode;
};

/**
 * Botón de la barra con un panel desplegable debajo.
 * Controlado por AppNavbar, que decide cuál está abierto y lo cierra al hacer clic fuera o con Escape.
 */
export function NavbarPopover({ icon, label, open, onToggle, trigger, panelClassName = 'w-[300px]', children }: NavbarPopoverProps) {
  const panelId = useId();
  const a11y = {
    'aria-label': label,
    title: label,
    'aria-expanded': open,
    'aria-controls': panelId,
    onClick: onToggle,
  };

  return (
    <div className="relative">
      {trigger ? (
        <button
          type="button"
          {...a11y}
          className="flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0"
        >
          {trigger}
        </button>
      ) : (
        <Button variant="ghost" icon={icon} {...a11y} className={open ? 'bg-surface-tint' : ''} />
      )}
      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={label}
          className={`absolute top-full right-0 z-20 mt-2 flex max-w-[calc(100vw-32px)] flex-col gap-4 rounded-lg border border-line bg-surface-raised p-4 shadow-md ${panelClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
