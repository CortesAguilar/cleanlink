import { useState, type FormEvent } from 'react';
import { formatMoney, isoDate } from '../data/format';
import type { ProviderPricing } from '../data/mock-pricing';
import { buildQuote } from '../data/quote';
import { saveRequest } from '../data/service-requests';
import { services } from '../data/services';
import { spaceTypeLabel, spaceTypes, type SpaceTypeId } from '../data/space-types';
import { getSession, isProviderBrowsing } from '../session/session';
import type { ProviderListing, ServiceId } from '../types/provider';
import { Button } from './button';
import { Card } from './card';
import { Check } from './check';
import { Icon } from './icon';
import { SelectField } from './select-field';
import { TextField } from './text-field';

type QuoteRequestCardProps = {
  provider: ProviderListing;
  pricing: ProviderPricing;
};

/**
 * Cotiza y solicita al proveedor, a lo ancho bajo Reseñas en tres partes (Servicios, Tu espacio,
 * Tu cotización) que se apilan en celular. La cotización es exacta y se actualiza al momento con
 * sus precios por m², su ajuste del tipo de espacio y sus m² máximos.
 * - Sin sesión: puede cotizar; "Solicitar" lleva a iniciar sesión (regla 1).
 * - Proveedor navegando: puede ver la cotización, pero "Solicitar" está deshabilitado.
 * - Cliente: la solicitud se guarda y aparece en "Mis servicios".
 */
export function QuoteRequestCard({ provider, pricing }: QuoteRequestCardProps) {
  const session = getSession();
  const providerBrowsing = isProviderBrowsing();
  const offered = services.filter((s) => pricing.prices[s.id] !== undefined);

  const [selected, setSelected] = useState<ServiceId[]>(provider.featuredServices.slice(0, 1));
  const [spaceType, setSpaceType] = useState<SpaceTypeId>('casa');
  const [m2, setM2] = useState('');
  const [date, setDate] = useState(isoDate(2));
  const [notes, setNotes] = useState('');
  const [sent, setSent] = useState(false);

  const area = Number(m2);
  const validArea = Number.isFinite(area) && area > 0;
  const tooBig = validArea && area > pricing.maxM2;
  const quote = validArea && !tooBig && selected.length > 0 ? buildQuote(pricing, selected, spaceType, area) : null;
  const factor = pricing.adjustments[spaceType] ?? 1;

  function toggle(id: ServiceId) {
    setSelected((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!quote || !session || providerBrowsing) return;
    saveRequest({
      date,
      status: 'pendiente',
      provider: { id: provider.id, name: provider.name, kind: provider.kind },
      client: { name: session.user.name, kind: 'persona', contact: session.user.name, email: session.user.email },
      spaceType,
      m2: area,
      lines: quote.lines,
      total: quote.total,
      notes: notes.trim() || undefined,
    });
    setSent(true);
  }

  if (sent && quote) {
    return (
      <Card padding="lg" role="status">
        <span className="flex size-12 items-center justify-center rounded-md bg-primary-soft text-on-primary-soft">
          <Icon name="check" size={28} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-heading">Solicitud enviada</h2>
          <p className="text-body-sm text-ink-muted">
            {provider.name} recibió tu solicitud por {formatMoney(quote.total)}. Te avisaremos cuando la acepte.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href="/mis-servicios" icon="receipt_long">
            Ver mis servicios
          </Button>
          <Button variant="ghost" onClick={() => setSent(false)}>
            Hacer otra solicitud
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card as="section" padding="lg" aria-labelledby="cotizar">
      <div className="flex flex-col gap-1">
        <h2 id="cotizar" className="text-heading">
          Cotiza y solicita
        </h2>
        <p className="text-caption text-ink-muted">Precios finales con IVA incluido. Sin cobro mínimo.</p>
      </div>

      <form
        className="grid gap-6 lg:grid-cols-[1fr_1.3fr_1fr] lg:items-start [&>*+*]:border-t [&>*+*]:border-line [&>*+*]:pt-5 lg:[&>*+*]:border-t-0 lg:[&>*+*]:border-l lg:[&>*+*]:pt-0 lg:[&>*+*]:pl-6"
        onSubmit={handleSubmit}
      >
        <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
          <legend className="mb-2 text-label">1. Servicios</legend>
          {offered.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3">
              <Check label={s.label} checked={selected.includes(s.id)} onChange={() => toggle(s.id)} />
              <span className="text-caption whitespace-nowrap text-ink-muted">{formatMoney(pricing.prices[s.id]!)} / m²</span>
            </div>
          ))}
          {selected.length === 0 && <span className="text-caption text-danger">Elige al menos un servicio.</span>}
        </fieldset>

        <fieldset className="m-0 grid min-w-0 gap-4 border-0 p-0 sm:grid-cols-2">
          <legend className="mb-2 text-label">2. Tu espacio</legend>
          <SelectField
            label="Tipo de espacio"
            value={spaceType}
            onChange={(e) => setSpaceType(e.target.value as SpaceTypeId)}
            options={spaceTypes.map((s) => ({ value: s.id, label: s.label }))}
            hint={factor === 1 ? 'Sin ajuste para este espacio.' : `Este proveedor ajusta el precio × ${factor} en ${spaceTypeLabel(spaceType).toLowerCase()}.`}
          />

          <TextField
            label="Metros cuadrados"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            placeholder="Ej. 80"
            value={m2}
            onChange={(e) => setM2(e.target.value)}
            error={tooBig ? `Este proveedor atiende hasta ${pricing.maxM2} m².` : undefined}
            hint={`Atiende hasta ${pricing.maxM2} m².`}
          />

          <TextField label="Fecha deseada" type="date" required min={isoDate(1)} value={date} onChange={(e) => setDate(e.target.value)} />

          <TextField
            label="Indicaciones"
            optional
            maxLength={200}
            placeholder="Ej. hay mascotas, acceso por la puerta trasera"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </fieldset>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-md bg-surface-tint p-4" aria-live="polite">
            <span className="text-label">3. Tu cotización</span>
            {quote ? (
              <>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {quote.lines.map((line) => (
                    <li key={line.serviceId} className="flex items-start justify-between gap-3 text-body-sm">
                      <span className="flex flex-col">
                        <span>{line.label}</span>
                        <span className="text-caption text-ink-muted">
                          {line.m2} m² × {formatMoney(line.pricePerM2)}
                          {line.factor !== 1 && ` × ${line.factor}`}
                        </span>
                      </span>
                      <span className="font-semibold whitespace-nowrap">{formatMoney(line.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
                  <span className="text-label">Total</span>
                  <span className="text-heading text-primary">{formatMoney(quote.total)}</span>
                </div>
              </>
            ) : (
              <span className="text-caption text-ink-muted">
                {tooBig ? 'Reduce los m² para ver la cotización.' : 'Elige servicios y escribe los m² para ver el precio exacto.'}
              </span>
            )}
          </div>

          {!session ? (
            <div className="flex flex-col gap-2">
              <Button href="/login" size="lg" icon="login">
                Inicia sesión para solicitar
              </Button>
            </div>
          ) : providerBrowsing ? (
            <div className="flex flex-col gap-2">
              <Button type="submit" size="lg" icon="event_available" disabled aria-describedby="aviso-proveedor">
                Solicitar servicio
              </Button>
              <p id="aviso-proveedor" className="flex items-start gap-1 text-caption text-ink-muted">
                <Icon name="info" size={14} className="mt-px flex-none" />
                Estás navegando como proveedor: puedes ver la cotización, pero no contratar servicios.
              </p>
            </div>
          ) : (
            <Button type="submit" size="lg" icon="event_available" disabled={!quote}>
              {quote ? `Solicitar por ${formatMoney(quote.total)}` : 'Solicitar servicio'}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
