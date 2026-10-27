/**
 * Quién ofrece el servicio:
 * - persona: un individuo.
 * - equipo: un grupo de individuos que trabajan juntos.
 * - empresa: toda una organización.
 */
export type ProviderKind = 'persona' | 'equipo' | 'empresa';

/** Calificación en estrellas completas, de 0 a 5 (sin medias estrellas). */
export type StarValue = 0 | 1 | 2 | 3 | 4 | 5;

/** Servicios que puede ofrecer un proveedor. */
export type ServiceId = 'casas' | 'oficinas' | 'profunda' | 'post-obra' | 'ventanas' | 'mudanzas';

/** Proveedor en la pantalla de resultados. Contrato esperado de GET /api/providers. */
export type ProviderListing = {
  id: string;
  name: string;
  kind: ProviderKind;
  zone: string;
  /** Solo equipos y empresas: número de integrantes. */
  teamSize?: number;
  /** Promedio de reseñas, con un decimal (ej. 4.9). */
  rating: number;
  reviews: number;
  verified: boolean;
  /** Todos los servicios que ofrece; los filtros usan esta lista completa. */
  services: ServiceId[];
  /** Máximo 2, elegidos por el proveedor en su perfil; son los que se ven en la tarjeta. */
  featuredServices: ServiceId[];
  schedule: Schedule;
};

export type Weekday = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom';

/** Horario de atención: disponible siempre, definido por días y horas, o sin definir. */
export type Schedule =
  | { mode: 'siempre' }
  | { mode: 'sin-definir' }
  | { mode: 'definido'; days: Weekday[]; from: string; to: string };

/** Datos mínimos de un proveedor para tarjetas de sugerencias. */
export type ProviderSummary = {
  id: string;
  name: string;
  kind: ProviderKind;
  rating: StarValue;
};
