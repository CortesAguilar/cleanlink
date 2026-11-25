import type { FormEvent } from 'react';
import { zones } from '../data/services';
import { Button } from './button';
import { Icon } from './icon';
import { ZoneInput } from './zone-input';

export type SearchQuery = {
  /** Qué se quiere limpiar o el servicio buscado. */
  query: string;
  /** Colonia. */
  zone: string;
};

type SearchBarProps = {
  onSearch?: (search: SearchQuery) => void;
};

/**
 * Buscador de servicio + zona (con sugerencias de colonias). No requiere sesión.
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
      className="flex flex-wrap gap-2 rounded-lg border border-line bg-surface-raised p-2"
    >
      <label className="flex min-h-12 flex-[2_1_200px] items-center gap-2 px-3">
        <Icon name="search" className="text-ink-muted" />
        <span className="sr-only">Servicio</span>
        <input
          name="query"
          type="text"
          placeholder="¿Qué necesitas limpiar?"
          className="w-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-muted"
        />
      </label>
      <ZoneInput name="zone" options={zones} placeholder="Colonia" listTitle="Colonias de Tijuana" />
      <Button type="submit" size="lg" className="grow sm:grow-0">
        Buscar
      </Button>
    </form>
  );
}
