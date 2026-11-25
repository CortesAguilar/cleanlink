import { useEffect } from 'react';
import { formatMoney } from '../data/format';
import { requestsForProvider } from '../data/service-requests';
import { getSession } from '../session/session';
import { AppNavbar } from './app-navbar';
import { Badge } from './badge';
import { Button } from './button';
import { Icon } from './icon';
import { RequestList } from './request-list';
import { StatTiles } from './stat-tiles';

/**
 * Panel del proveedor (/panel): personas, empresas e instituciones a las que les presta
 * servicio; cada tarjeta lleva al detalle. Es su primera pantalla al iniciar sesión y solo él la ve.
 */
export function ProviderPanelView() {
  const session = getSession();
  const isProvider = session?.user.accountType === 'proveedor';

  useEffect(() => {
    if (!isProvider) window.location.assign('/login');
  }, [isProvider]);

  if (!session || !isProvider) return null;

  // API: GET /api/tenant/requests. Mientras tanto, datos de prueba (ver service-requests.ts).
  const requests = requestsForProvider(session.user);
  const active = requests.filter((r) => r.status !== 'finalizada');
  const clients = new Set(requests.map((r) => r.client.email));
  const organizations = new Set(requests.filter((r) => r.client.kind !== 'persona').map((r) => r.client.email));
  const billed = requests.filter((r) => r.status === 'finalizada').reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="min-h-svh">
      <AppNavbar />
      <main className="mx-auto flex max-w-[1100px] flex-col gap-6 px-6 py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <Badge tone="persona" icon="admin_panel_settings">
              Panel del proveedor
            </Badge>
            <h1 className="text-title">Clientes y servicios</h1>
            <p className="text-body-sm text-ink-muted">
              Personas, empresas e instituciones a las que les prestas servicio, con el detalle de cada uno.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1 text-caption text-ink-muted">
              <Icon name="lock" size={14} />
              Solo tú puedes ver este panel
            </span>
            <Button variant="outline" href="/mi-negocio" icon="storefront">
              Servicios y precios
            </Button>
          </div>
        </header>

        <StatTiles
          tiles={[
            { label: 'Clientes', value: String(clients.size), icon: 'groups' },
            { label: 'Empresas e instituciones', value: String(organizations.size), icon: 'apartment' },
            { label: 'Servicios por atender', value: String(active.length), icon: 'event_upcoming' },
            { label: 'Cobrado (finalizados)', value: formatMoney(billed), icon: 'payments' },
          ]}
        />

        <RequestList requests={requests} viewer="proveedor" emptyText="No hay servicios con este estado." />
      </main>
    </div>
  );
}
