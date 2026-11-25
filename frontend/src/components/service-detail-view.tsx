import { useEffect, useState, type ReactNode } from 'react';
import { formatDate, formatMoney } from '../data/format';
import { providerKindLabels } from '../data/provider-kinds';
import { clientKindLabels, requestsForClient, requestsForProvider, setRequestStatus, type ClientKind } from '../data/service-requests';
import { spaceTypeLabel } from '../data/space-types';
import { getSession } from '../session/session';
import { AppNavbar } from './app-navbar';
import { Avatar } from './avatar';
import { Badge } from './badge';
import { Button } from './button';
import { Icon } from './icon';
import { StatusBadge } from './status-badge';

const clientKindIcons: Record<ClientKind, string> = {
  persona: 'person',
  empresa: 'apartment',
  institucion: 'account_balance',
};

/** Bloque del detalle con encabezado (icono + título) y contenido. */
function DetailBlock({ icon, title, children }: { icon?: string; title?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface-raised">
      {title && (
        <h2 className="m-0 flex items-center gap-2 border-b border-line px-4 py-3 text-label">
          {icon && <Icon name={icon} size={18} className="text-primary" />}
          {title}
        </h2>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

const pendingNote = {
  proveedor: 'El cliente verá la solicitud como aceptada.',
  cliente: 'Esperando a que el proveedor acepte tu solicitud. Te avisaremos en notificaciones.',
};

/**
 * Detalle de un servicio: servicio, cotización, indicaciones y la otra parte.
 * - proveedor (/panel/servicio?id=): ve al cliente y puede aceptar una solicitud pendiente.
 * - cliente (/mis-servicios/servicio?id=): ve al proveedor y el enlace a su perfil.
 */
export function ServiceDetailView({ viewer }: { viewer: 'proveedor' | 'cliente' }) {
  const session = getSession();
  const allowed = session?.user.accountType === viewer;
  const isProvider = viewer === 'proveedor';
  // Sube al aceptar, para volver a leer la solicitud con su nuevo estado.
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!allowed) window.location.assign('/login');
  }, [allowed]);

  if (!session || !allowed) return null;

  // API: GET /api/tenant/requests/{id} (proveedor) o GET /api/requests/{id} (cliente).
  // Mientras tanto, se busca entre las de su lista.
  const id = new URLSearchParams(window.location.search).get('id');
  const list = isProvider ? requestsForProvider(session.user) : requestsForClient(session.user);
  const request = list.find((r) => r.id === id);
  const back = isProvider ? { href: '/panel', label: 'Clientes y servicios' } : { href: '/mis-servicios', label: 'Mis servicios' };
  const other = request && (isProvider ? request.client : request.provider);
  const otherIsGroup = request ? (isProvider ? request.client.kind !== 'persona' : request.provider.kind !== 'persona') : false;

  function accept() {
    if (!request) return;
    setRequestStatus(request.id, 'aceptada');
    setVersion((v) => v + 1);
  }

  return (
    <div className="min-h-svh">
      <AppNavbar />
      <main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-6 py-8">
        <a href={back.href} className="inline-flex items-center gap-1 self-start text-label text-primary no-underline">
          <Icon name="arrow_back" size={18} />
          {back.label}
        </a>

        {!request || !other ? (
          <p className="rounded-lg border border-line bg-surface-raised p-8 text-center text-body text-ink-muted">
            No encontramos este servicio.
          </p>
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={other.name} isGroup={otherIsGroup} size={48} />
                <div className="flex min-w-0 flex-col">
                  <h1 className="text-title break-words">{other.name}</h1>
                  <span className="text-body-sm text-ink-muted">
                    Solicitud {isProvider ? 'recibida' : 'enviada'} el {formatDate(request.createdAt)}
                  </span>
                </div>
              </div>
              <StatusBadge status={request.status} />
            </header>

            <div className="grid items-start gap-4 md:grid-cols-[1.6fr_1fr]">
              <div className="flex flex-col gap-4">
                <DetailBlock icon="cleaning_services" title="Servicio">
                  <dl className="m-0 grid grid-cols-2 gap-4 text-body-sm">
                    <div>
                      <dt className="text-caption text-ink-muted">Fecha</dt>
                      <dd className="m-0 first-letter:uppercase">
                        {formatDate(request.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-caption text-ink-muted">Tipo de limpieza</dt>
                      <dd className="m-0">{request.lines.map((l) => l.label).join(' + ')}</dd>
                    </div>
                    <div>
                      <dt className="text-caption text-ink-muted">Espacio</dt>
                      <dd className="m-0">{spaceTypeLabel(request.spaceType)}</dd>
                    </div>
                    <div>
                      <dt className="text-caption text-ink-muted">Superficie</dt>
                      <dd className="m-0">{request.m2} m²</dd>
                    </div>
                  </dl>
                </DetailBlock>

                <DetailBlock icon="request_quote" title="Cotización">
                  <table className="w-full border-collapse text-body-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-caption text-ink-muted">
                        <th className="py-2 font-medium">Concepto</th>
                        <th className="py-2 font-medium">Cálculo</th>
                        <th className="py-2 text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {request.lines.map((l) => (
                        <tr key={l.serviceId} className="border-b border-line">
                          <td className="py-2">{l.label}</td>
                          <td className="py-2 text-ink-muted">
                            {l.m2} m² × {formatMoney(l.pricePerM2)}
                            {l.factor !== 1 && ` × ${l.factor}`}
                          </td>
                          <td className="py-2 text-right">{formatMoney(l.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="text-body font-bold">
                        <td colSpan={2} className="pt-3">
                          Total
                        </td>
                        <td className="pt-3 text-right text-primary">{formatMoney(request.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </DetailBlock>

                {request.notes && (
                  <DetailBlock icon="sticky_note_2" title="Indicaciones del cliente">
                    <p className="m-0 text-body-sm">{request.notes}</p>
                  </DetailBlock>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {isProvider ? (
                  <DetailBlock icon={clientKindIcons[request.client.kind]} title="Cliente">
                    <div className="flex flex-col gap-3">
                      <dl className="m-0 flex flex-col gap-3 text-body-sm">
                        <div>
                          <dt className="text-caption text-ink-muted">Tipo de cliente</dt>
                          <dd className="m-0 mt-1">
                            <Badge tone={request.client.kind === 'persona' ? 'persona' : 'grupo'}>
                              {clientKindLabels[request.client.kind]}
                            </Badge>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-caption text-ink-muted">Contacto</dt>
                          <dd className="m-0">{request.client.contact}</dd>
                        </div>
                      </dl>
                      <div className="flex flex-col gap-1 border-t border-line pt-3 text-body-sm">
                        <a href={`mailto:${request.client.email}`} className="inline-flex items-center gap-2 py-1 break-all text-ink no-underline hover:text-primary">
                          <Icon name="mail" size={18} className="text-ink-muted" />
                          {request.client.email}
                        </a>
                        {request.client.phone && (
                          <a href={`tel:${request.client.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 py-1 text-ink no-underline hover:text-primary">
                            <Icon name="call" size={18} className="text-ink-muted" />
                            {request.client.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </DetailBlock>
                ) : (
                  <DetailBlock icon={otherIsGroup ? 'groups' : 'person'} title="Proveedor">
                    <div className="flex flex-col gap-3">
                      <dl className="m-0 text-body-sm">
                        <dt className="text-caption text-ink-muted">Tipo de proveedor</dt>
                        <dd className="m-0 mt-1">
                          <Badge tone={otherIsGroup ? 'grupo' : 'persona'}>{providerKindLabels[request.provider.kind]}</Badge>
                        </dd>
                      </dl>
                      <Button variant="outline" href={`/proveedor?id=${request.provider.id}`} icon="storefront">
                        Ver perfil del proveedor
                      </Button>
                    </div>
                  </DetailBlock>
                )}

                {request.status === 'pendiente' && (
                  <DetailBlock>
                    <div className="flex flex-col gap-2">
                      {isProvider && (
                        <Button icon="check" onClick={accept}>
                          Aceptar solicitud
                        </Button>
                      )}
                      <span className={`text-caption text-ink-muted ${isProvider ? 'text-center' : ''}`}>{pendingNote[viewer]}</span>
                    </div>
                  </DetailBlock>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
