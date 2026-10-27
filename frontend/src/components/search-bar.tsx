import type { FormEvent } from 'react';
import { Button } from './button';
import { Icon } from './icon';

export type SearchQuery = {
  /** Qué se quiere limpiar o el servicio buscado. */
  query: string;
  /** Colonia o ciudad. */
  zone: string;
};

type SearchBarProps = {
  onSearch?: (search: SearchQuery) => void;
};

/**
 * Buscador de servicio + zona. No requiere sesión.
 * Entrega lo escrito en `onSearch`; quien lo usa decide a dónde llevarlo.
 */
export function SearchBar({ onSearch }: SearchBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSearch?.({
      query: String(data.get('query') ?? '').trim(),
      zone: String(data.get('zone') ?? '').trim(),
    });
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-2 rounded-lg border border-line bg-surface-raised p-2 shadow-md"
    >
      <label className="flex min-h-12 flex-[1_1_200px] items-center gap-2 px-3">
        <Icon name="search" className="text-ink-muted" />
        <span className="sr-only">Servicio</span>
        <input
          name="query"
          type="text"
          placeholder="¿Qué necesitas limpiar?"
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-muted"
        />
      </label>
      <label className="flex min-h-12 flex-[1_1_160px] items-center gap-2 border-line px-3 sm:border-l">
        <Icon name="location_on" className="text-ink-muted" />
        <span className="sr-only">Zona</span>
        <input
          name="zone"
          type="text"
          placeholder="Colonia o ciudad"
          className="min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-muted"
        />
      </label>
      <Button type="submit" size="lg" className="grow sm:grow-0">
        Buscar
      </Button>
    </form>
  );
}
