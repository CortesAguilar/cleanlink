import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import { useCatalog } from '../api/use-catalog';
import { providerKindLabels } from '../data/provider-kinds';
import { formatSchedule } from '../data/schedule';
import {
  adjustmentsToDraft,
  draftToAdjustments,
  draftToSchedule,
  draftToServices,
  draftToTeam,
  scheduleToDraft,
  servicesToDraft,
  teamToDraft,
  toNumber,
} from '../data/tenant-form';
import { clearSession, getSession } from '../session/session';
import type { TenantDetail } from '../types/tenant';
import { AppNavbar } from './app-navbar';
import { Badge } from './badge';
import { Button } from './button';
import { Card } from './card';
import { ScheduleField } from './schedule-field';
import { ServicesPriceField } from './services-price-field';
import { SpaceAdjustmentsField } from './space-adjustments-field';
import { TeamSizeField } from './team-size-field';
import { TextArea } from './text-area';
import { TextField } from './text-field';
import { VerifyEmailBanner } from './verify-email-banner';

type SaveState = { saving: boolean; message?: string; error?: string; errors?: Record<string, string> };

/** Envía un cambio del tenant y deja el resultado en el estado de esa sección. */
function useSave(onSaved: (tenant: TenantDetail) => void) {
  const [state, setState] = useState<SaveState>({ saving: false });
  async function save(path: string, body: unknown) {
    setState({ saving: true });
    try {
      onSaved(await api<TenantDetail>(path, 'PUT', body));
      setState({ saving: false, message: 'Cambios guardados' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return window.location.assign('/login');
      setState({
        saving: false,
        error: err instanceof ApiError ? err.message : 'No se pudo guardar',
        errors: err instanceof ApiError ? err.fields : {},
      });
    }
  }
  return [state, save] as const;
}

function SaveBar({ state, label = 'Guardar cambios' }: { state: SaveState; label?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-4">
      {state.message && (
        <span className="text-body-sm text-success" role="status">
          {state.message}
        </span>
      )}
      {state.error && (
        <span className="text-body-sm text-danger" role="alert">
          {state.error}
        </span>
      )}
      <Button type="submit" disabled={state.saving}>
        {state.saving ? 'Guardando…' : label}
      </Button>
    </div>
  );
}

function Section({ title, onSubmit, children }: { title: string; onSubmit: (e: FormEvent) => void; children: ReactNode }) {
  return (
    <Card as="section" padding="lg" elevation="raised">
      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
        <h2 className="text-heading">{title}</h2>
        {children}
      </form>
    </Card>
  );
}

/** Servicios, destacados y precios por m². */
function ServicesSection({ tenant, onSaved }: { tenant: TenantDetail; onSaved: (t: TenantDetail) => void }) {
  const catalog = useCatalog();
  const [draft, setDraft] = useState(() => servicesToDraft(tenant.services));
  const [state, save] = useSave(onSaved);
  return (
    <Section
      title="Servicios y precios"
      onSubmit={(e) => {
        e.preventDefault();
        save('/tenant/servicios', { services: draftToServices(draft) });
      }}
    >
      <ServicesPriceField catalog={catalog.services} value={draft} onChange={setDraft} error={state.errors?.services} />
      <SaveBar state={state} />
    </Section>
  );
}

/** Ajustes de precio por tipo de espacio. */
function AdjustmentsSection({ tenant, onSaved }: { tenant: TenantDetail; onSaved: (t: TenantDetail) => void }) {
  const catalog = useCatalog();
  const [draft, setDraft] = useState(() => adjustmentsToDraft(tenant.spaceAdjustments));
  const [state, save] = useSave(onSaved);
  return (
    <Section
      title="Ajustes por tipo de espacio"
      onSubmit={(e) => {
        e.preventDefault();
        save('/tenant/ajustes', { spaceAdjustments: draftToAdjustments(draft) });
      }}
    >
      <SpaceAdjustmentsField
        spaceTypes={catalog.spaceTypes}
        value={draft}
        onChange={setDraft}
        error={state.errors?.spaceAdjustments}
      />
      <SaveBar state={state} />
    </Section>
  );
}

/** Personas, m² máximos, horario, ubicación y presentación. */
function OperationSection({ tenant, onSaved }: { tenant: TenantDetail; onSaved: (t: TenantDetail) => void }) {
  const [team, setTeam] = useState(() => teamToDraft(tenant));
  const [maxM2, setMaxM2] = useState(String(tenant.maxM2));
  const [schedule, setSchedule] = useState(() => scheduleToDraft(tenant.schedule));
  const [city, setCity] = useState(tenant.city);
  const [state, setState] = useState(tenant.state);
  const [about, setAbout] = useState(tenant.about ?? '');
  const [saveState, save] = useSave(onSaved);
  const errors = saveState.errors ?? {};
  return (
    <Section
      title="Operación y perfil"
      onSubmit={(e) => {
        e.preventDefault();
        save('/tenant/perfil', {
          ...draftToTeam(tenant.kind, team),
          maxM2: toNumber(maxM2),
          schedule: draftToSchedule(schedule),
          city,
          state,
          about,
        });
      }}
    >
      <TeamSizeField kind={tenant.kind} value={team} onChange={setTeam} error={errors.teamSize ?? errors.teamMin} />
      <div className="w-56">
        <TextField
          label="m² máximos que atiendes"
          type="number"
          inputMode="numeric"
          min="1"
          required
          value={maxM2}
          error={errors.maxM2}
          onChange={(e) => setMaxM2(e.target.value)}
        />
      </div>
      <ScheduleField value={schedule} onChange={setSchedule} error={errors.schedule} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Ciudad" required value={city} error={errors.city} onChange={(e) => setCity(e.target.value)} />
        <TextField label="Estado" required value={state} error={errors.state} onChange={(e) => setState(e.target.value)} />
      </div>
      <TextArea label="Presentación" optional maxLength={1000} value={about} onChange={(e) => setAbout(e.target.value)} />
      <SaveBar state={saveState} />
    </Section>
  );
}

/** Personas que trabajan, en texto. */
function teamLabel(tenant: TenantDetail) {
  if (tenant.kind === 'equipo') return `${tenant.teamSize} personas`;
  if (tenant.kind === 'empresa') return `${tenant.teamMin} a ${tenant.teamMax} personas`;
  return '1 persona';
}

/**
 * Vista de gestión del tenant (/mi-negocio). Todo lo que se ve y se edita aquí
 * sale de GET /api/tenant: el backend decide el tenant a partir del token de sesión.
 */
export function TenantDashboardView() {
  const session = getSession();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user.accountType !== 'proveedor') {
      window.location.assign('/login');
      return;
    }
    api<TenantDetail>('/tenant')
      .then(setTenant)
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return window.location.assign('/login');
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar tu información');
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
      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-10">
        {error && (
          <Card tone="tint" role="alert">
            <p className="text-body-sm text-danger">{error}</p>
          </Card>
        )}
        {!tenant && !error && <p className="text-body-sm text-ink-muted">Cargando tu información…</p>}

        {tenant && (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-label text-ink-muted">Mi negocio</p>
                <h1 className="text-title">{tenant.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={tenant.kind === 'persona' ? 'persona' : 'grupo'}>{providerKindLabels[tenant.kind]}</Badge>
                  {tenant.verified ? (
                    <Badge tone="success" icon="verified">
                      Verificado
                    </Badge>
                  ) : (
                    <Badge tone="warning">Sin verificar</Badge>
                  )}
                  <span className="text-body-sm text-ink-muted">
                    {teamLabel(tenant)} · {tenant.city}, {tenant.state} · {formatSchedule(tenant.schedule)}
                  </span>
                </div>
                <p className="text-body-sm text-ink-muted">{tenant.email}</p>
              </div>
              <Button variant="outline" icon="logout" onClick={logout}>
                Cerrar sesión
              </Button>
            </header>

            {!tenant.verified && <VerifyEmailBanner email={tenant.email} />}

            <Card tone="tint" padding="md" aria-labelledby="aislamiento">
              <div className="flex items-center gap-2">
                <Badge tone="persona" icon="lock">
                  Datos aislados
                </Badge>
                <h2 id="aislamiento" className="text-label">
                  Tu espacio en la base de datos
                </h2>
              </div>
              <dl className="grid gap-x-6 gap-y-2 text-body-sm md:grid-cols-2">
                <div>
                  <dt className="text-ink-muted">Esquema propio</dt>
                  <dd className="m-0 font-mono">{tenant.isolation.schema}</dd>
                </div>
                <div>
                  <dt className="text-ink-muted">Usuario de base de datos</dt>
                  <dd className="m-0 font-mono">{tenant.isolation.dbUser}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-ink-muted">Esta página se consultó en SQL Server como</dt>
                  <dd className="m-0 font-mono">
                    {tenant.isolation.sqlUser} (esquema por defecto: {tenant.isolation.sqlDefaultSchema})
                  </dd>
                </div>
              </dl>
            </Card>

            <ServicesSection tenant={tenant} onSaved={setTenant} />
            <AdjustmentsSection tenant={tenant} onSaved={setTenant} />
            <OperationSection tenant={tenant} onSaved={setTenant} />
          </>
        )}
      </main>
    </div>
  );
}
