import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { providerKindLabels } from '../data/provider-kinds';
import { clearSession, getSession } from '../session/session';
import type { ProviderKind } from '../types/provider';
import type { AdminTenant } from '../types/tenant';
import { AppNavbar } from './app-navbar';
import { Badge } from './badge';
import { Button } from './button';
import { Card } from './card';

const kinds: ProviderKind[] = ['persona', 'equipo', 'empresa'];

const dateFormat = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="md" elevation="raised" className="gap-1">
      <span className="text-caption text-ink-muted">{label}</span>
      <span className="text-title">{value}</span>
    </Card>
  );
}

/**
 * Panel del admin de plataforma (equipo de CleanLink) en /admin.
 * Muestra el registro de tenants (esquema core de la base de datos): quiénes
 * son y dónde están aislados. No muestra los datos privados de ningún tenant.
 */
export function AdminView() {
  const session = getSession();
  const [tenants, setTenants] = useState<AdminTenant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user.accountType !== 'admin') {
      window.location.assign('/login');
      return;
    }
    api<AdminTenant[]>('/admin/tenants')
      .then(setTenants)
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return window.location.assign('/login');
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar la lista de tenants');
      });
    // Solo al entrar a la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    clearSession();
    window.location.assign('/login');
  }

  return (
    <div className="min-h-svh">
      <AppNavbar />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-10">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-label text-ink-muted">Admin de plataforma</p>
            <h1 className="text-title">Panel de CleanLink</h1>
            <p className="text-body-sm text-ink-muted">{session?.user.email}</p>
          </div>
          <Button variant="outline" icon="logout" onClick={logout}>
            Cerrar sesión
          </Button>
        </header>

        <Card tone="tint" padding="md">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="persona" icon="shield_person">
              Acceso mínimo
            </Badge>
            <p className="text-body-sm">
              Ves el <strong>registro de tenants</strong> (quiénes son y en qué esquema están aislados), no sus datos privados:
              servicios, precios y horarios solo los ve cada tenant.
            </p>
          </div>
        </Card>

        {error && (
          <Card tone="tint" role="alert">
            <p className="text-body-sm text-danger">{error}</p>
          </Card>
        )}
        {!tenants && !error && <p className="text-body-sm text-ink-muted">Cargando tenants…</p>}

        {tenants && (
          <>
            <section aria-label="Resumen" className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <Stat label="Tenants" value={tenants.length} />
              <Stat label="Verificados" value={tenants.filter((t) => t.verified).length} />
              {kinds.map((k) => (
                <Stat key={k} label={`${providerKindLabels[k]}s`} value={tenants.filter((t) => t.kind === k).length} />
              ))}
            </section>

            <Card as="section" padding="sm" elevation="raised" aria-labelledby="tenants" className="gap-2">
              <h2 id="tenants" className="px-2 pt-2 text-heading">
                Tenants registrados
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-body-sm">
                  <thead className="text-caption text-ink-muted">
                    <tr className="border-b border-line">
                      <th className="px-3 py-2 font-semibold">Tenant</th>
                      <th className="px-3 py-2 font-semibold">Tipo</th>
                      <th className="px-3 py-2 font-semibold">Ubicación</th>
                      <th className="px-3 py-2 font-semibold">Estado</th>
                      <th className="px-3 py-2 font-semibold">Esquema / usuario de BD</th>
                      <th className="px-3 py-2 font-semibold">Alta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map((t) => (
                      <tr key={t.id} className="border-b border-line last:border-b-0">
                        <td className="px-3 py-3">
                          <div className="font-semibold">{t.name}</div>
                          <div className="text-caption text-ink-muted">{t.email}</div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={t.kind === 'persona' ? 'persona' : 'grupo'}>{providerKindLabels[t.kind]}</Badge>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {t.city}, {t.state}
                        </td>
                        <td className="px-3 py-3">
                          {t.verified ? <Badge tone="success">Verificado</Badge> : <Badge tone="warning">Sin verificar</Badge>}
                        </td>
                        <td className="px-3 py-3 font-mono text-caption">
                          <div>{t.schema}</div>
                          <div className="text-ink-muted">
                            {t.dbUser} · {t.tables} tablas
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-ink-muted">{dateFormat.format(new Date(t.createdAt))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tenants.length === 0 && <p className="px-3 pb-3 text-body-sm text-ink-muted">Aún no hay tenants.</p>}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
