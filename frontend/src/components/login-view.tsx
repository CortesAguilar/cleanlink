import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { homeFor, saveSession } from '../session/session';
import type { AuthResponse } from '../types/tenant';
import { Button } from './button';
import { Card } from './card';
import { PublicNavbar } from './public-navbar';
import { TextField } from './text-field';

const links = [{ label: 'Explorar', href: '/' }];

/** Inicio de sesión para clientes, proveedores y admin de plataforma. */
export function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const session = await api<AuthResponse>('/auth/login', 'POST', { email, password });
      saveSession(session);
      window.location.assign(homeFor(session.user));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión');
      setSending(false);
    }
  }

  return (
    <div className="min-h-svh">
      <PublicNavbar links={links} loginHref="/login" signupHref="/registro/proveedor" />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-title">Iniciar sesión</h1>
          <p className="text-body-sm text-ink-muted">Entra con el correo de tu cuenta de CleanLink.</p>
        </div>
        <Card as="section" padding="lg" elevation="raised">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <TextField
              label="Correo"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p role="alert" className="text-body-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" disabled={sending}>
              {sending ? 'Entrando…' : 'Iniciar sesión'}
            </Button>
          </form>
        </Card>
        <p className="text-body-sm text-ink-muted">
          ¿Ofreces servicios de limpieza?{' '}
          <a href="/registro/proveedor" className="text-primary">
            Registra tu negocio
          </a>
        </p>
      </main>
    </div>
  );
}
