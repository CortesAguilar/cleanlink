import { useState } from 'react';
import { mockFeaturedProviders } from '../data/mock-providers';
import { AppNavbar } from './app-navbar';
import { FilterCard } from './filter-card';
import { SearchBar, type SearchQuery } from './search-bar';
import { SuggestionCard } from './suggestion-card';

type FeedFilter = 'mejor-calificados' | 'mas-solicitados' | 'residencial' | 'comercial';

const filters: { value: FeedFilter; label: string; icon: string }[] = [
  { value: 'mejor-calificados', label: 'Mejores calificaciones', icon: 'star' },
  { value: 'mas-solicitados', label: 'Más solicitados', icon: 'trending_up' },
  { value: 'residencial', label: 'Limpieza residencial', icon: 'home' },
  { value: 'comercial', label: 'Limpieza comercial', icon: 'apartment' },
];

/** Pantalla principal dentro de la plataforma: buscador, filtros y lo más destacado. */
export function FeedView() {
  const [filter, setFilter] = useState<FeedFilter | null>(null);
  // API: GET /api/providers/destacados — proveedores con más movimiento.
  const featured = mockFeaturedProviders;

  function handleSearch(search: SearchQuery) {
    // La búsqueda viaja en la URL; la pantalla de resultados hará la llamada a la API.
    const params = new URLSearchParams();
    if (search.query) params.set('q', search.query);
    if (search.zone) params.set('zona', search.zone);
    if (filter) params.set('filtro', filter);
    window.location.assign(`/resultados?${params}`);
  }

  function handleFilter(value: FeedFilter) {
    setFilter(filter === value ? null : value);
  }

  return (
    <div className="min-h-svh">
      <AppNavbar />
      <main className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-12">
        <section aria-label="Buscar" className="mx-auto w-full max-w-3xl">
          <SearchBar onSearch={handleSearch} />
        </section>

        <section aria-label="Filtros" className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
          {filters.map((f) => (
            <FilterCard
              key={f.value}
              icon={f.icon}
              label={f.label}
              selected={filter === f.value}
              onClick={() => handleFilter(f.value)}
            />
          ))}
        </section>

        <section aria-labelledby="destacados" className="mx-auto flex w-full max-w-4xl flex-col gap-4">
          <h2 id="destacados" className="text-heading">
            Lo más destacado
          </h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {featured.map((provider) => (
              <li key={provider.id}>
                <SuggestionCard provider={provider} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
