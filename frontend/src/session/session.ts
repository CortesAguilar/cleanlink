import type { AuthResponse, SessionUser } from '../types/tenant';

// Sesión guardada en el navegador: token JWT (7 días) y datos de la cuenta.
// El tenant lo decide el backend a partir del token; el frontend nunca lo envía.
const KEY = 'cleanlink.session';

export type Session = AuthResponse;

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Sin almacenamiento (navegación privada): la sesión dura lo que la pestaña.
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nada que limpiar.
  }
}

const PRIVATE_PATHS = ['/mi-negocio', '/admin'];

/**
 * Si la página se mostró con los botones Atrás/Adelante del navegador, la sesión
 * termina y hay que iniciar sesión de nuevo. Recargar (F5) no la cierra.
 */
export function endSessionOnHistoryNavigation() {
  function end() {
    clearSession();
    if (PRIVATE_PATHS.includes(window.location.pathname)) window.location.replace('/login');
  }

  const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  if (entry?.type === 'back_forward') end();

  // Página restaurada de la caché del navegador: React no vuelve a ejecutarse.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) end();
  });
}

/** Pantalla a la que va cada tipo de cuenta después de iniciar sesión. */
export function homeFor(user: SessionUser) {
  if (user.accountType === 'admin') return '/admin';
  return user.accountType === 'proveedor' ? '/mi-negocio' : '/feed';
}
