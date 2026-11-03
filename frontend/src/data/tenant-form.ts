import type { ProviderKind, Schedule, Weekday } from '../types/provider';
import type { SpaceAdjustment, TenantService } from '../types/tenant';

// Borradores de los formularios de alta y de gestión del tenant: los campos
// se editan como texto y se convierten al contrato de la API al enviar.

export const MAX_FEATURED = 2;

/** Servicios que ofrece, por id del catálogo. Solo están los marcados. */
export type ServicesDraft = Record<string, { price: string; featured: boolean }>;

export type ScheduleDraft = { mode: Schedule['mode']; days: Weekday[]; from: string; to: string };

export type TeamDraft = { teamSize: string; teamMin: string; teamMax: string };

/** Factor por id de tipo de espacio. */
export type AdjustmentsDraft = Record<string, string>;

/** Texto de un campo numérico a número; vacío = null (la API responde qué falta). */
export function toNumber(text: string) {
  return text.trim() === '' ? null : Number(text);
}

export function servicesToDraft(services: TenantService[]): ServicesDraft {
  return Object.fromEntries(services.map((s) => [s.id, { price: String(s.pricePerM2), featured: s.featured }]));
}

export function draftToServices(draft: ServicesDraft): TenantService[] {
  return Object.entries(draft).map(([id, s]) => ({ id, pricePerM2: toNumber(s.price) ?? 0, featured: s.featured }));
}

export const emptySchedule: ScheduleDraft = { mode: 'siempre', days: ['lun', 'mar', 'mie', 'jue', 'vie'], from: '08:00', to: '18:00' };

export function scheduleToDraft(schedule: Schedule): ScheduleDraft {
  return schedule.mode === 'definido' ? { ...schedule } : { ...emptySchedule, mode: schedule.mode };
}

export function draftToSchedule(draft: ScheduleDraft): Schedule {
  return draft.mode === 'definido'
    ? { mode: 'definido', days: draft.days, from: draft.from, to: draft.to }
    : { mode: draft.mode };
}

export const emptyTeam: TeamDraft = { teamSize: '', teamMin: '', teamMax: '' };

export function teamToDraft(team: { teamSize?: number | null; teamMin?: number | null; teamMax?: number | null }): TeamDraft {
  return {
    teamSize: team.teamSize ? String(team.teamSize) : '',
    teamMin: team.teamMin ? String(team.teamMin) : '',
    teamMax: team.teamMax ? String(team.teamMax) : '',
  };
}

/** Persona = 1 (no se pide); equipo = número fijo; empresa = rango. */
export function draftToTeam(kind: ProviderKind, draft: TeamDraft) {
  if (kind === 'equipo') return { teamSize: toNumber(draft.teamSize) };
  if (kind === 'empresa') return { teamMin: toNumber(draft.teamMin), teamMax: toNumber(draft.teamMax) };
  return {};
}

export function adjustmentsToDraft(adjustments: SpaceAdjustment[]): AdjustmentsDraft {
  return Object.fromEntries(adjustments.map((a) => [a.id, String(a.factor)]));
}

export function draftToAdjustments(draft: AdjustmentsDraft): SpaceAdjustment[] {
  return Object.entries(draft)
    .filter(([, factor]) => factor.trim() !== '')
    .map(([id, factor]) => ({ id, factor: Number(factor) }));
}
