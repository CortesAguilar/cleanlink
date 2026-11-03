import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { getSession, homeFor } from '../session/session';
import { Button } from './button';
import { Card } from './card';
import { Icon } from './icon';
import { PublicNavbar } from './public-navbar';

const links = [{ label: 'Explorar', href: '/' }];

type Status = 'verificando' | 'listo' | 'error';

// El token solo sirve una vez: se guarda la petición para que el doble efecto
// de React en desarrollo no lo envíe dos veces.
const requests = new Map<string, Promise<unknown>>();
function verify(token: string) {
  if (!requests.has(token)) requests.set(token, api<{ verified: boolean }>('/auth/verify-email', 'POST', { token }));
  return requests.get(token)!;
}

/** Destino del enlace del correo de verificación: /verificar?token=… */
export function VerifyEmailView() {
  const [status, setStatus] = useState<Status>('verificando');
  const [error, setError] = useState('');
  const session = getSession();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token') ?? '';
    verify(token)
      .then(() => setStatus('listo'))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'No se pudo confirmar tu correo');
        setStatus('error');
      });
  }, []);

  const next = session ? { href: homeFor(session.user), label: 'Ir a mi cuenta' } : { href: '/login', label: 'Iniciar sesión' };

  return (
    <div className="min-h-svh">
      <PublicNavbar links={links} loginHref="/login" signupHref="/registro/proveedor" />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <Card as="section" padding="lg" elevation="raised" className="items-center text-center">
          {status === 'verificando' && <p className="text-body text-ink-muted">Confirmando tu correo…</p>}
          {status === 'listo' && (
            <>
              <Icon name="mark_email_read" size={48} className="text-success" />
              <h1 className="text-title">¡Correo confirmado!</h1>
              <p className="text-body text-ink-muted">Tu cuenta de CleanLink ya está verificada.</p>
              <Button href={next.href} size="lg">
                {next.label}
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <Icon name="error" size={48} className="text-danger" />
              <h1 className="text-title">No pudimos confirmar tu correo</h1>
              <p role="alert" className="text-body text-ink-muted">
                {error}
              </p>
              <Button href={next.href} variant="outline">
                {next.label}
              </Button>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
