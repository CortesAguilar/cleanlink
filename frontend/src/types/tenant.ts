import type { ProviderKind, Schedule } from './provider';

/** Tipo de cuenta: se elige al registrarse y no cambia. */
export type AccountType = 'cliente' | 'proveedor' | 'admin';

/** Cuenta con sesión. Contrato de GET /api/me y de la respuesta de login. */
export type SessionUser = {
  id: number;
  name: string;
  email: string;
  accountType: AccountType;
  /** Solo proveedores: su tenant. */
  tenantId: number | null;
};

/** Servicio del catálogo global. Contrato de GET /api/services. */
export type CatalogService = {
  id: string;
  label: string;
  short: string;
  category: 'residencial' | 'comercial' | 'ambas';
};

/** Tipo de espacio del catálogo global. Contrato de GET /api/space-types. */
export type SpaceType = {
  id: string;
  label: string;
};

/** Servicio que ofrece el tenant, con su precio final (IVA incluido) por m². */
export type TenantService = {
  id: string;
  label?: string;
  pricePerM2: number;
  featured: boolean;
};

/** Ajuste del precio por tipo de espacio (1.0 = sin ajuste). */
export type SpaceAdjustment = {
  id: string;
  label?: string;
  factor: number;
};

/** Datos de operación que el tenant edita en su vista de gestión. */
export type TenantOperation = {
  teamSize?: number | null;
  teamMin?: number | null;
  teamMax?: number | null;
  maxM2: number;
  schedule: Schedule;
  city: string;
  state: string;
  about?: string | null;
};

/** Cuerpo de POST /api/tenants (alta de tenant). */
export type NewTenant = TenantOperation & {
  name: string;
  email: string;
  password: string;
  kind: ProviderKind;
  services: TenantService[];
  spaceAdjustments: SpaceAdjustment[];
};

/** Vista de gestión del tenant. Contrato de GET /api/tenant. */
export type TenantDetail = TenantOperation & {
  id: number;
  name: string;
  email: string;
  kind: ProviderKind;
  verified: boolean;
  createdAt: string;
  services: TenantService[];
  spaceAdjustments: SpaceAdjustment[];
  /** Cómo está aislado este tenant en la base de datos (se muestra en la demo). */
  isolation: {
    schema: string;
    dbUser: string;
    /** Usuario con el que SQL Server respondió la consulta. */
    sqlUser: string;
    /** Esquema por defecto con el que SQL Server resolvió las tablas. */
    sqlDefaultSchema: string;
  };
};

/** Respuesta de login y de alta: token de sesión de 7 días y la cuenta. */
export type AuthResponse = {
  token: string;
  user: SessionUser;
};
