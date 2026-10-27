import { useId, useState } from 'react';
import { Button } from './button';
import { Logo } from './logo';

export type NavLink = {
  label: string;
  href: string;
  /** Marca el enlace de la página actual. */
  current?: boolean;
};

type PublicNavbarProps = {
  links: NavLink[];
  loginHref: string;
  signupHref: string;
};

/**
 * Barra de navegación pública (sin sesión): logo, enlaces y acciones de cuenta.
 * En pantallas chicas los enlaces y acciones se agrupan en un menú desplegable.
 */
export function PublicNavbar({ links, loginHref, signupHref }: PublicNavbarProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  const linkClasses = (current?: boolean) =>
    `no-underline transition-colors hover:text-primary ${current ? 'text-primary' : 'text-ink-muted'}`;

  return (
    <header className="border-b border-line bg-surface-raised">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-4">
        <Logo />

        <nav aria-label="Principal" className="hidden gap-6 text-label md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={link.current ? 'page' : undefined}
              className={linkClasses(link.current)}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" href={loginHref}>
            Iniciar sesión
          </Button>
          <Button href={signupHref}>Crear cuenta</Button>
        </div>

        <Button
          variant="ghost"
          icon={open ? 'close' : 'menu'}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen(!open)}
          className="md:hidden"
        />
      </div>

      {open && (
        <div id={menuId} className="flex flex-col gap-4 border-t border-line px-6 py-4 md:hidden">
          <nav aria-label="Principal" className="flex flex-col text-label">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                aria-current={link.current ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`py-3 ${linkClasses(link.current)}`}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-2">
            <Button variant="outline" href={loginHref}>
              Iniciar sesión
            </Button>
            <Button href={signupHref}>Crear cuenta</Button>
          </div>
        </div>
      )}
    </header>
  );
}
