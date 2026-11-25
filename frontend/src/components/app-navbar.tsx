import { useEffect, useRef, useState } from 'react';
import { markNotificationsRead, notificationIcons, notificationsFor, readNotificationIds, timeAgo } from '../data/notifications';
import { clearSession, getSession, startFor } from '../session/session';
import type { AccountType } from '../types/tenant';
import { Avatar } from './avatar';
import { Button } from './button';
import { Icon } from './icon';
import { Logo } from './logo';
import { NavbarPopover } from './navbar-popover';
import { ThemeToggle } from './theme-toggle';

type Panel = 'notificaciones' | 'cuenta';

type MenuLink = { label: string; href: string; icon: string };

const howItWorks: MenuLink = { label: 'Cómo funciona', href: '/#como-funciona', icon: 'help' };

/** Enlaces del menú de la cuenta según su tipo. */
function menuLinks(accountType: AccountType | null): MenuLink[] {
  const explore = { label: 'Buscar limpieza', href: '/resultados', icon: 'search' };
  switch (accountType) {
    case 'cliente':
      return [
        { label: 'Inicio', href: '/feed', icon: 'home' },
        { label: 'Mis servicios', href: '/mis-servicios', icon: 'receipt_long' },
        explore,
      ];
    case 'proveedor':
      return [
        { label: 'Inicio', href: '/feed', icon: 'home' },
        { label: 'Clientes y servicios', href: '/panel', icon: 'admin_panel_settings' },
        { label: 'Mi negocio', href: '/mi-negocio', icon: 'storefront' },
        explore,
      ];
    case 'admin':
      return [{ label: 'Panel de CleanLink', href: '/admin', icon: 'shield_person' }, explore];
    default:
      return [{ label: 'Inicio', href: '/', icon: 'home' }, explore];
  }
}

/** El enlace de la pantalla actual (o de la que la contiene: /panel/servicio cuenta como /panel). */
function isCurrent(href: string) {
  const path = window.location.pathname;
  return path === href || path.startsWith(`${href}/`);
}

const linkClasses =
  'flex items-center gap-3 rounded-md px-3 py-2.5 text-label text-ink no-underline transition-colors hover:bg-surface-tint aria-[current=page]:bg-surface-tint';

/**
 * Barra de navegación dentro de la plataforma.
 * - Logo: lleva al inicio (feed) sin cerrar la sesión; el admin va a su panel.
 * - Notificaciones: avisos de la cuenta; las nuevas llevan un punto naranja dentro del panel (sin número en la barra).
 * - Avatar: único menú, con la cuenta, la navegación y cerrar sesión. Sin sesión, un icono que invita a entrar.
 * Solo un panel abierto a la vez; se cierra con clic fuera o Escape.
 */
export function AppNavbar() {
  const session = getSession();
  const user = session?.user ?? null;
  const [open, setOpen] = useState<Panel | null>(null);
  const [readIds, setReadIds] = useState(readNotificationIds);
  const ref = useRef<HTMLDivElement>(null);

  // API: GET /api/notifications.
  const notifications = user ? notificationsFor(user.accountType) : [];
  const unread = notifications.filter((n) => !readIds.includes(n.id));

  // Cierra el panel al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    function close() {
      setOpen(null);
      setReadIds(readNotificationIds());
    }
    function onPointer(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Al abrir las notificaciones se guardan como leídas, pero los puntos de "nueva" se ven
  // hasta cerrar el panel (entonces se vuelve a leer qué está leído).
  function toggle(panel: Panel) {
    const next = open === panel ? null : panel;
    if (next === 'notificaciones') markNotificationsRead(unread.map((n) => n.id));
    if (open === 'notificaciones') setReadIds(readNotificationIds());
    setOpen(next);
  }

  function logout() {
    clearSession();
    window.location.assign('/login');
  }

  return (
    <header className="border-b border-line bg-surface-raised">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3">
        <Logo href={user ? startFor(user) : '/'} />
        <div ref={ref} className="flex items-center gap-2">
          <ThemeToggle />
          <NavbarPopover
            icon="notifications"
            label="Notificaciones"
            open={open === 'notificaciones'}
            onToggle={() => toggle('notificaciones')}
            panelClassName="w-[360px] gap-2 p-2"
          >
            <h2 className="px-2 pt-2 text-body font-semibold">Notificaciones</h2>
            {notifications.length > 0 ? (
              <ul className="m-0 flex max-h-[70svh] list-none flex-col overflow-y-auto p-0">
                {notifications.map((n) => {
                  const isNew = !readIds.includes(n.id);
                  return (
                    <li key={n.id}>
                      <a href={n.href} className="flex gap-3 rounded-md p-2 text-ink no-underline transition-colors hover:bg-surface-tint">
                        <span className="flex size-9 flex-none items-center justify-center rounded-md bg-surface-tint text-primary">
                          <Icon name={notificationIcons[n.kind]} size={18} filled={n.kind === 'calificacion'} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex items-start justify-between gap-2">
                            <span className="text-label">{n.title}</span>
                            {isNew && <span className="mt-1.5 size-2 flex-none rounded-full bg-pending" aria-label="Nueva" />}
                          </span>
                          <span className="text-body-sm text-ink-muted">{n.body}</span>
                          <span className="text-caption text-ink-muted">{timeAgo(n.createdAt)}</span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-md bg-surface-tint px-4 py-6 text-center">
                <Icon name="notifications_off" size={28} className="text-ink-muted" />
                <p className="text-body-sm font-semibold">No tienes notificaciones</p>
                <p className="text-caption text-ink-muted">Aquí verás las solicitudes y los avisos de tu cuenta.</p>
              </div>
            )}
          </NavbarPopover>

          <NavbarPopover
            icon="person"
            label={user ? 'Mi cuenta' : 'Entrar'}
            open={open === 'cuenta'}
            onToggle={() => toggle('cuenta')}
            trigger={
              user ? (
                <span className={`flex rounded-full ${open === 'cuenta' ? 'outline-2 outline-offset-2 outline-primary' : ''}`}>
                  <Avatar name={user.name} size={36} />
                </span>
              ) : undefined
            }
            panelClassName="w-[280px] gap-1 p-2"
          >
            {user ? (
              <div className="flex items-center gap-3 border-b border-line px-2 pt-2 pb-3">
                <Avatar name={user.name} size={40} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-body font-semibold">{user.name}</span>
                  <span className="truncate text-caption text-ink-muted">{user.email}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 border-b border-line p-2 pb-3">
                <span className="text-body-sm text-ink-muted">Entra para contratar servicios y ver tu historial.</span>
                <Button href="/login">Iniciar sesión</Button>
                <Button variant="outline" href="/registro">
                  Crear cuenta
                </Button>
              </div>
            )}
            <nav aria-label="Menú" className="flex flex-col">
              {menuLinks(user?.accountType ?? null).map((link) => (
                <a key={link.href} href={link.href} className={linkClasses} aria-current={isCurrent(link.href) ? 'page' : undefined}>
                  <Icon name={link.icon} className="text-primary" />
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex flex-col border-t border-line pt-1">
              <a href={howItWorks.href} className={linkClasses}>
                <Icon name={howItWorks.icon} className="text-primary" />
                {howItWorks.label}
              </a>
              {user && (
                <button type="button" onClick={logout} className={`${linkClasses} cursor-pointer border-0 bg-transparent text-left`}>
                  <Icon name="logout" className="text-primary" />
                  Cerrar sesión
                </button>
              )}
            </div>
          </NavbarPopover>
        </div>
      </div>
    </header>
  );
}
