import { useState } from 'react';
import { api, ApiError } from '../api/client';
import { Button } from './button';
import { Card } from './card';
import { Icon } from './icon';

type VerifyEmailBannerProps = {
  email: string;
};

/**
 * Aviso para una cuenta sin verificar: puede usar su vista de gestión, pero
 * no publicar hasta confirmar su correo. Permite pedir otro correo.
 */
export function VerifyEmailBanner({ email }: VerifyEmailBannerProps) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await api<{ verified: boolean; emailSent: boolean }>('/auth/resend-verification', 'POST');
      if (res.verified) window.location.reload();
      else if (res.emailSent) setMessage('Te enviamos un correo nuevo.');
      else setError('No se pudo enviar el correo. Intenta de nuevo en un momento.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el correo');
    } finally {
      setSending(false);
    }
  }

  return (
    <Card tone="tint" padding="md" role="status">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Icon name="mark_email_unread" size={24} className="text-warning" />
          <div className="flex flex-col gap-1">
            <p className="text-label">Confirma tu correo</p>
            <p className="text-body-sm text-ink-muted">
              Te enviamos un enlace a <strong className="text-ink">{email}</strong>. Revisa también la carpeta de spam. Mientras
              no lo confirmes, tu cuenta no puede publicar.
            </p>
            {message && <p className="text-body-sm text-success">{message}</p>}
            {error && <p className="text-body-sm text-danger">{error}</p>}
          </div>
        </div>
        <Button variant="outline" icon="send" onClick={resend} disabled={sending}>
          {sending ? 'Enviando…' : 'Reenviar correo'}
        </Button>
      </div>
    </Card>
  );
}
