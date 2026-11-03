import { MAX_FEATURED, type ServicesDraft } from '../data/tenant-form';
import type { CatalogService } from '../types/tenant';
import { Check } from './check';
import { Chip } from './chip';
import { TextField } from './text-field';

type ServicesPriceFieldProps = {
  catalog: CatalogService[];
  value: ServicesDraft;
  onChange: (value: ServicesDraft) => void;
  error?: string;
};

/**
 * Servicios del catálogo que ofrece el proveedor, con su precio por m² y hasta 2 destacados.
 * Los destacados son los únicos que se ven en la tarjeta de resultados.
 */
export function ServicesPriceField({ catalog, value, onChange, error }: ServicesPriceFieldProps) {
  const featuredCount = Object.values(value).filter((s) => s.featured).length;

  function toggle(id: string, offered: boolean) {
    const next = { ...value };
    if (offered) next[id] = { price: '', featured: featuredCount < MAX_FEATURED };
    else delete next[id];
    onChange(next);
  }

  function update(id: string, change: Partial<ServicesDraft[string]>) {
    onChange({ ...value, [id]: { ...value[id], ...change } });
  }

  return (
    <fieldset className="m-0 flex flex-col gap-4 border-0 p-0">
      <legend className="mb-2 text-label">Servicios que ofreces</legend>
      <p className="text-body-sm text-ink-muted">
        Marca los servicios, ponles un precio por m² y elige {MAX_FEATURED} destacados (son los que se ven en tu tarjeta).
        Los precios son <strong className="text-ink">finales: ya incluyen IVA</strong>.
      </p>
      <ul className="flex flex-col gap-3">
        {catalog.map((service) => {
          const selected = value[service.id];
          return (
            <li
              key={service.id}
              className="flex flex-wrap items-end gap-4 rounded-md border border-line bg-surface-raised p-4"
            >
              <div className="min-w-[200px] flex-1 self-center">
                <Check
                  label={service.label}
                  checked={Boolean(selected)}
                  onChange={(e) => toggle(service.id, e.target.checked)}
                />
              </div>
              {selected && (
                <>
                  <div className="w-40">
                    <TextField
                      label="Precio por m² (MXN)"
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      step="0.01"
                      required
                      value={selected.price}
                      onChange={(e) => update(service.id, { price: e.target.value })}
                    />
                  </div>
                  <Chip
                    selected={selected.featured}
                    onClick={() =>
                      (selected.featured || featuredCount < MAX_FEATURED) && update(service.id, { featured: !selected.featured })
                    }
                  >
                    {selected.featured ? '★ Destacado' : 'Destacar'}
                  </Chip>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-caption text-ink-muted" aria-live="polite">
        Destacados: {featuredCount} de {MAX_FEATURED}
      </p>
      {error && <p className="text-caption text-danger">{error}</p>}
    </fieldset>
  );
}
