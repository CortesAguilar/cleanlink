import { useState, type FormEvent, type ReactNode } from 'react';
import { api, ApiError } from '../api/client';
import { useCatalog } from '../api/use-catalog';
import { providerKindLabels } from '../data/provider-kinds';
import {
  draftToAdjustments,
  draftToSchedule,
  draftToServices,
  draftToTeam,
  emptySchedule,
  emptyTeam,
  toNumber,
  type AdjustmentsDraft,
  type ServicesDraft,
} from '../data/tenant-form';
import { saveSession } from '../session/session';
import type { ProviderKind } from '../types/provider';
import type { AuthResponse, NewTenant } from '../types/tenant';
import { Button } from './button';
import { Card } from './card';
import { Chip } from './chip';
import { PublicNavbar } from './public-navbar';
import { ScheduleField } from './schedule-field';
import { ServicesPriceField } from './services-price-field';
import { SpaceAdjustmentsField } from './space-adjustments-field';
import { TeamSizeField } from './team-size-field';
import { TextArea } from './text-area';
import { TextField } from './text-field';

const links = [{ label: 'Explorar', href: '/' }];
const kinds: ProviderKind[] = ['persona', 'equipo', 'empresa'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card as="section" padding="lg" elevation="raised">
      <h2 className="text-heading">{title}</h2>
      {children}
    </Card>
  );
}

/**
 * Alta de tenant: registro de un proveedor (persona, equipo o empresa).
 * Al terminar, el backend crea su espacio aislado en la base de datos y
 * devuelve la sesión; se entra directo a su vista de gestión.
 */
export function TenantSignupView() {
  const catalog = useCatalog();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kind, setKind] = useState<ProviderKind>('persona');
  const [team, setTeam] = useState(emptyTeam);
  const [city, setCity] = useState('Tijuana');
  const [state, setState] = useState('Baja California');
  const [services, setServices] = useState<ServicesDraft>({});
  const [adjustments, setAdjustments] = useState<AdjustmentsDraft>({});
  const [maxM2, setMaxM2] = useState('');
  const [schedule, setSchedule] = useState(emptySchedule);
  const [about, setAbout] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const body: NewTenant = {
      name,
      email,
      password,
      kind,
      ...draftToTeam(kind, team),
      city,
      state,
      about,
      maxM2: toNumber(maxM2) ?? 0,
      schedule: draftToSchedule(schedule),
      services: draftToServices(services),
      spaceAdjustments: draftToAdjustments(adjustments),
    };
    setSending(true);
    setError(null);
    setErrors({});
    try {
      const session = await api<AuthResponse>('/tenants', 'POST', body);
      saveSession(session);
      window.location.assign('/mi-negocio');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrors(err.fields);
      } else {
        setError('No se pudo completar el registro');
      }
      setSending(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <div className="min-h-svh">
      <PublicNavbar links={links} loginHref="/login" signupHref="/registro/proveedor" />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-title">Registra tu negocio de limpieza</h1>
          <p className="text-body text-ink-muted">
            Crea tu cuenta de proveedor. Tus datos de gestión quedan aislados de los demás proveedores.
          </p>
        </div>

        {(error || catalog.error) && (
          <Card tone="tint" padding="md" role="alert">
            <p className="text-body-sm font-semibold text-danger">{error ?? catalog.error}</p>
            {Object.keys(errors).length > 0 && (
              <ul className="list-disc pl-5 text-body-sm text-ink">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>{message}</li>
                ))}
              </ul>
            )}
          </Card>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <Section title="Cuenta">
            <TextField
              label="Nombre de la persona, equipo o empresa"
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
              minLength={8}
              required
              hint="Mínimo 8 caracteres."
              value={password}
              error={errors.password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Section>

          <Section title="¿Quién ofrece el servicio?">
            <div role="group" aria-label="Tipo de proveedor" className="flex flex-wrap gap-2">
              {kinds.map((k) => (
                <Chip key={k} variant="solid" selected={kind === k} onClick={() => setKind(k)}>
                  {providerKindLabels[k]}
                </Chip>
              ))}
            </div>
            <TeamSizeField kind={kind} value={team} onChange={setTeam} error={errors.teamSize ?? errors.teamMin} />
          </Section>

          <Section title="Ubicación">
            <p className="text-body-sm text-ink-muted">Solo ciudad y estado; se muestra únicamente en tu perfil.</p>
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Ciudad" required value={city} error={errors.city} onChange={(e) => setCity(e.target.value)} />
              <TextField label="Estado" required value={state} error={errors.state} onChange={(e) => setState(e.target.value)} />
            </div>
          </Section>

          <Section title="Servicios y precios">
            {catalog.loading ? (
              <p className="text-body-sm text-ink-muted">Cargando catálogo…</p>
            ) : (
              <ServicesPriceField catalog={catalog.services} value={services} onChange={setServices} error={errors.services} />
            )}
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
            <SpaceAdjustmentsField
              spaceTypes={catalog.spaceTypes}
              value={adjustments}
              onChange={setAdjustments}
              error={errors.spaceAdjustments}
            />
          </Section>

          <Section title="Horario">
            <ScheduleField value={schedule} onChange={setSchedule} error={errors.schedule} />
          </Section>

          <Section title="Presentación">
            <TextArea
              label="Cuéntale a tus clientes quién eres"
              optional
              maxLength={1000}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
            />
          </Section>

          <div className="flex flex-wrap items-center justify-end gap-4">
            <a href="/login" className="text-body-sm text-primary">
              Ya tengo cuenta
            </a>
            <Button type="submit" size="lg" disabled={sending || catalog.loading}>
              {sending ? 'Creando tu cuenta…' : 'Crear cuenta de proveedor'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
