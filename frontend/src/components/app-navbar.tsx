import { Button } from './button';
import { Logo } from './logo';

/**
 * Barra de navegación dentro de la plataforma (con sesión):
 * logo a la izquierda; notificaciones, perfil y menú a la derecha.
 * Los iconos aún no despliegan nada.
 */
export function AppNavbar() {
  return (
    <header className="border-b border-line bg-surface-raised">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-3">
        <Logo />
        <div className="flex items-center gap-2">
          <Button variant="ghost" icon="notifications" aria-label="Notificaciones" />
          <Button variant="ghost" icon="person" aria-label="Mi perfil" />
          <Button variant="ghost" icon="menu" aria-label="Menú" />
        </div>
      </div>
    </header>
  );
}
