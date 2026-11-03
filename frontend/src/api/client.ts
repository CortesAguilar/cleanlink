import { clearSession, getSession } from '../session/session';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** Error de la API con el mensaje general y, si los hay, los errores por campo. */
export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;

  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** Llama a la API de CleanLink. Si hay sesión, envía su token. */
export async function api<T>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  const session = getSession();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Intenta de nuevo.', 0);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // Token vencido o inválido: se cierra la sesión local.
    if (res.status === 401 && session) clearSession();
    throw new ApiError(data?.error ?? 'Ocurrió un error inesperado', res.status, data?.errors);
  }
  return data as T;
}
