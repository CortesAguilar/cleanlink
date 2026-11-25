import type { ProviderSummary } from '../types/provider';
import { mockListings } from './mock-listings';

// Datos de prueba mientras no existe la API: los primeros proveedores de resultados,
// para que la calificación y el servicio coincidan con su tarjeta y su perfil.
// API: reemplazar por GET /api/providers/destacados (proveedores con más movimiento).
export const mockFeaturedProviders: ProviderSummary[] = mockListings.slice(0, 10).map((p) => ({
  id: p.id,
  name: p.name,
  kind: p.kind,
  rating: p.rating,
  featuredService: p.featuredServices[0] ?? null,
}));
