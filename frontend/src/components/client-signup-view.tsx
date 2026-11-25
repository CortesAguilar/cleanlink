import { useState, type FormEvent } from 'react';
import { api, ApiError } from '../api/client';
import { homeFor, saveSession } from '../session/session';
import type { AuthResponse } from '../types/tenant';
import { Button } from './button';
import { Card } from './card';
import { PublicNavbar } from './public-navbar';
import { TextField } from './text-field';

const links = [{ label: 'Explorar', href: '/' }];

/** Registro de cliente (quien busca limpieza): nombre, correo y contraseña. */
export function ClientSignupView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setErrors({});
    try {
      // API: POST /api/auth/register crea la cuenta con tipo 'cliente' y devuelve la sesión.
      const session = await api<AuthResponse>('/auth/register', 'POST', { name, email, password });
      saveSession(session);
      window.location.assign(homeFor(session.user));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrors(err.fields);
      } else {
        setError('No se pudo crear la cuenta');
      }
      setSending(false);
    }
  }

  return (
    <div className="min-h-svh">
      <PublicNavbar links={links} loginHref="/login" signupHref="/registro" />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <a href="/registro" className="flex items-center gap-1 self-start text-label text-primary no-underline">
          ← Cambiar tipo de cuenta
        </a>
        <div className="flex flex-col gap-2">
          <h1 className="text-title">Crea tu cuenta de cliente</h1>
          <p className="text-body-sm text-ink-muted">Para contratar servicios de limpieza y calificarlos.</p>
        </div>
        <Card as="section" padding="lg">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <TextField
              label="Nombre"
              autoComplete="name"
              required
              value={name}
              error={errors.name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Correo"
              type="email"
              autoComplete="email"
              required
              value={email}
              error={errors.email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              hint="Mínimo 8 caracteres."
              value={password}
              error={errors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && Object.keys(errors).length === 0 && (
              <p role="alert" className="text-body-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" disabled={sending}>
              {sending ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          </form>
        </Card>
        <p className="text-body-sm text-ink-muted">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-primary">
            Inicia sesión
          </a>
        </p>
      </main>
    </div>
  );
}
