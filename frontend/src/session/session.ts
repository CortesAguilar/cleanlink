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

/** Pantalla a la que va cada tipo de cuenta después de iniciar sesión. */
export function homeFor(user: SessionUser) {
  return user.accountType === 'proveedor' ? '/mi-negocio' : '/feed';
}
