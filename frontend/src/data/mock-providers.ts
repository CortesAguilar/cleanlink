import type { ProviderSummary } from '../types/provider';

// Datos de prueba mientras no existe la API.
// API: reemplazar por GET /api/providers/destacados (proveedores con más movimiento).
export const mockFeaturedProviders: ProviderSummary[] = [
  { id: '1', name: 'Brillo Total', kind: 'equipo', rating: 5 },
  { id: '2', name: 'María López', kind: 'persona', rating: 5 },
  { id: '3', name: 'Equipo Aqua', kind: 'equipo', rating: 4 },
  { id: '4', name: 'Rosa Hernández', kind: 'persona', rating: 4 },
  { id: '5', name: 'LimpiaPro', kind: 'empresa', rating: 4 },
  { id: '6', name: 'Daniel Ruiz', kind: 'persona', rating: 3 },
  { id: '7', name: 'Casa Impecable', kind: 'equipo', rating: 3 },
  { id: '8', name: 'Laura Castro', kind: 'persona', rating: 5 },
  { id: '9', name: 'Oficinas Relucientes', kind: 'empresa', rating: 2 },
  { id: '10', name: 'Pedro Sánchez', kind: 'persona', rating: 0 },
];
