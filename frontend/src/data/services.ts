import type { ServiceId } from '../types/provider';

// Catálogo de servicios. API: GET /api/services cuando exista.
export const services: { id: ServiceId; label: string; short: string }[] = [
  { id: 'casas', label: 'Casas y departamentos', short: 'Casas' },
  { id: 'oficinas', label: 'Oficinas y locales', short: 'Oficinas' },
  { id: 'profunda', label: 'Limpieza profunda', short: 'Limpieza profunda' },
  { id: 'post-obra', label: 'Post-obra', short: 'Post-obra' },
  { id: 'ventanas', label: 'Ventanas y fachadas', short: 'Ventanas' },
  { id: 'mudanzas', label: 'Mudanzas', short: 'Mudanzas' },
];

// Zonas de Tijuana. API: GET /api/zones cuando exista.
export const zones = ['Zona Río', 'Otay', 'Playas de Tijuana', 'Centro', 'Chapultepec', 'Hipódromo', 'La Mesa'];
