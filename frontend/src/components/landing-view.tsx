import { LandingHero } from './landing-hero';
import { PublicNavbar } from './public-navbar';

const links = [
  { label: 'Explorar', href: '#' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Para grupos', href: '#para-quien' },
];

/**
 * Pantalla 1: página principal para quien aún no inicia sesión.
 * Buscar no requiere sesión (ver ANOTACIONES.txt).
 */
export function LandingView() {
  return (
    <div className="min-h-svh">
      <PublicNavbar links={links} loginHref="#" signupHref="#" />
      <main>
        {/* TODO: llevar la búsqueda a la vista Explorar cuando exista. */}
        <LandingHero />
      </main>
    </div>
  );
}
