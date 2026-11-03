import { useEffect, useState } from 'react';
import type { CatalogService, SpaceType } from '../types/tenant';
import { api, ApiError } from './client';

/** Catálogos globales: servicios (GET /api/services) y tipos de espacio (GET /api/space-types). */
export function useCatalog() {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api<CatalogService[]>('/services'), api<SpaceType[]>('/space-types')])
      .then(([s, t]) => {
        setServices(s);
        setSpaceTypes(t);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los catálogos'));
  }, []);

  return { services, spaceTypes, error, loading: !error && services.length === 0 };
}
