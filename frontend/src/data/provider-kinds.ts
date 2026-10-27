import type { ProviderKind } from '../types/provider';

/** Texto visible de cada tipo de proveedor. */
export const providerKindLabels: Record<ProviderKind, string> = {
  persona: 'Persona',
  equipo: 'Equipo',
  empresa: 'Empresa',
};
