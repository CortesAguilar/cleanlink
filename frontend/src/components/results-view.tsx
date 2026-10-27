import { useState } from 'react';
import { mockListings } from '../data/mock-listings';
import { zones } from '../data/services';
import type { ProviderKind } from '../types/provider';
import { AppNavbar } from './app-navbar';
import { Button } from './button';
import { Chip } from './chip';
import { ProviderCard } from './provider-card';
import { ResultsFilters, type ResultsFiltersValue } from './results-filters';

type KindTab = 'todos' | ProviderKind;

const tabs: { value: KindTab; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'persona', label: 'Personas' },
  { value: 'equipo', label: 'Equipos' },
  { value: 'empresa', label: 'Empresas' },
];

/** Filtros iniciales a partir de la URL que arma el feed (?q=&zona=&filtro=). */
function initialFilters(params: URLSearchParams): ResultsFiltersValue {
  const filter = params.get('filtro');
  const zone = params.get('zona') ?? '';
  return {
    services: filter === 'residencial' ? ['casas'] : filter === 'comercial' ? ['oficinas'] : [],
    zone: zones.includes(zone) ? zone : '',
    minRating: filter === 'mejor-calificados' ? 4.5 : 0,
    verifiedOnly: false,
  };
}

/** Pantalla de resultados de búsqueda (Explorar en el diseño). */
export function ResultsView() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  const sortByRequests = params.get('filtro') === 'mas-solicitados';

  const [filters, setFilters] = useState(() => initialFilters(params));
  const [tab, setTab] = useState<KindTab>('todos');

  // API: GET /api/providers?query={query}&zone={filters.zone}&services={filters.services}
  //      &minRating={filters.minRating}&verified={filters.verifiedOnly}&kind={tab}&sort={rating|requests}
  // Mientras tanto se filtra y ordena localmente sobre los datos de prueba.
  const results = mockListings
    .filter((p) => tab === 'todos' || p.kind === tab)
    .filter((p) => filters.services.length === 0 || filters.services.some((s) => p.services.includes(s)))
    .filter((p) => !filters.zone || p.zone === filters.zone)
    .filter((p) => p.rating >= filters.minRating)
    .filter((p) => !filters.verifiedOnly || p.verified)
    .sort((a, b) => (sortByRequests ? b.reviews - a.reviews : b.rating - a.rating));

  const place = filters.zone || 'Tijuana';
  const sortLabel = sortByRequests ? 'ordenados por solicitudes' : 'ordenados por calificación';

  return (
    <div className="min-h-svh">
      <AppNavbar />
      <main className="mx-auto flex max-w-[1240px] flex-wrap items-start gap-8 px-6 py-8">
        <div className="max-w-[280px] min-w-0 flex-[1_1_240px]">
          <ResultsFilters value={filters} onChange={setFilters} />
        </div>

        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-title">Proveedores en {place}</h1>
              <p className="text-body-sm text-ink-muted">
                {query && `“${query}” · `}
                {results.length} resultados · {sortLabel}
              </p>
            </div>
            <div role="group" aria-label="Tipo de proveedor" className="flex gap-2">
              {tabs.map((t) => (
                <Chip key={t.value} variant="solid" selected={tab === t.value} onClick={() => setTab(t.value)}>
                  {t.label}
                </Chip>
              ))}
            </div>
          </div>

          {results.length > 0 ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {results.map((provider) => (
                <li key={provider.id}>
                  {/* TODO: enlazar al perfil cuando exista la pantalla. */}
                  <ProviderCard provider={provider} href="#" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-line bg-surface-raised p-8 text-center text-body text-ink-muted">
              No hay proveedores con estos filtros. Prueba quitando alguno.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface-tint p-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-heading">¿No encuentras lo que buscas?</h2>
              <p className="text-body-sm text-ink-muted">Publica tu solicitud y deja que los proveedores te contacten.</p>
            </div>
            {/* Requiere sesión (ver ANOTACIONES.txt). */}
            <Button href="#">Publicar solicitud</Button>
          </div>
        </section>
      </main>
    </div>
  );
}
