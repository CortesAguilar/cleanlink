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

// La sesión solo termina con el botón "Cerrar sesión" (o si el backend rechaza un token vencido).
// Navegar, recargar o usar Atrás/Adelante no la cierra.

/** Pantalla a la que va cada tipo de cuenta después de iniciar sesión. */
export function homeFor(user: SessionUser) {
  if (user.accountType === 'admin') return '/admin';
  return user.accountType === 'proveedor' ? '/panel' : '/feed';
}

/**
 * Inicio de la plataforma (logo e "Ir a mi inicio"): el feed, tanto para clientes como
 * para proveedores. Es un enlace normal, así que la sesión se conserva. El admin va a su panel.
 */
export function startFor(user: SessionUser) {
  return user.accountType === 'admin' ? '/admin' : '/feed';
}

/** Un proveedor navegando la plataforma: ve la información, pero no puede contratar. */
export function isProviderBrowsing() {
  return getSession()?.user.accountType === 'proveedor';
}
