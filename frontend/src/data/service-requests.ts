import type { ProviderKind, ServiceId } from '../types/provider';
import { mockPricing } from './mock-pricing';
import { buildQuote, type QuoteLine } from './quote';
import { normalize } from './search';
import type { SpaceTypeId } from './space-types';

export type RequestStatus = 'pendiente' | 'aceptada' | 'finalizada';

export const statusLabels: Record<RequestStatus, string> = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  finalizada: 'Finalizada',
};

/** Quién recibe el servicio: una persona, una empresa o una institución (escuela, gobierno, etc.). */
export type ClientKind = 'persona' | 'empresa' | 'institucion';

export const clientKindLabels: Record<ClientKind, string> = {
  persona: 'Persona',
  empresa: 'Empresa',
  institucion: 'Institución',
};

/** Solicitud de servicio con su cotización. Contrato esperado de POST/GET /api/requests. */
export type ServiceRequest = {
  id: string;
  createdAt: string;
  /** Fecha deseada del servicio, 'AAAA-MM-DD'. */
  date: string;
  status: RequestStatus;
  provider: { id: string; name: string; kind: ProviderKind };
  client: { name: string; kind: ClientKind; contact: string; email: string; phone?: string };
  spaceType: SpaceTypeId;
  m2: number;
  lines: QuoteLine[];
  total: number;
  notes?: string;
};

// Sin API de solicitudes todavía: las que envía el cliente se guardan en este navegador.
// API: reemplazar por POST /api/requests y GET /api/requests (cliente) o GET /api/tenant/requests (proveedor).
const KEY = 'cleanlink.requests';

function loadLocal(): ServiceRequest[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ServiceRequest[]) : [];
  } catch {
    return [];
  }
}

/** Guarda una solicitud nueva; el id y la fecha de creación se asignan aquí. */
export function saveRequest(data: Omit<ServiceRequest, 'id' | 'createdAt'>) {
  const request: ServiceRequest = { ...data, id: `sol-${Date.now()}`, createdAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify([request, ...loadLocal()]));
  } catch {
    // Sin almacenamiento (navegación privada): la solicitud no se conserva.
  }
}

// Cambios de estado (p. ej. el proveedor acepta) de cualquier solicitud, por id.
// API: PUT /api/tenant/requests/{id} con { status }.
const STATUS_KEY = 'cleanlink.request-status';

function loadStatuses(): Record<string, RequestStatus> {
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, RequestStatus>) : {};
  } catch {
    return {};
  }
}

export function setRequestStatus(id: string, status: RequestStatus) {
  try {
    localStorage.setItem(STATUS_KEY, JSON.stringify({ ...loadStatuses(), [id]: status }));
  } catch {
    // Sin almacenamiento: el cambio dura lo que la página.
  }
}

/** Aplica los cambios de estado guardados. */
function withStatuses(requests: ServiceRequest[]) {
  const statuses = loadStatuses();
  return requests.map((r) => (statuses[r.id] ? { ...r, status: statuses[r.id] } : r));
}

/** Arma una solicitud de prueba con la cotización calculada igual que en el perfil. */
function mock(
  id: string,
  providerId: string,
  provider: ServiceRequest['provider'],
  client: ServiceRequest['client'],
  serviceIds: ServiceId[],
  spaceType: SpaceTypeId,
  m2: number,
  date: string,
  status: RequestStatus,
): ServiceRequest {
  const quote = buildQuote(mockPricing[providerId], serviceIds, spaceType, m2);
  return { id, createdAt: `${date}T09:00:00`, date, status, provider, client, spaceType, m2, ...quote };
}

const byNewest = (a: ServiceRequest, b: ServiceRequest) => b.date.localeCompare(a.date);

/** Servicios contratados por un cliente: los de prueba y los que pidió desde este navegador. */
export function requestsForClient(user: { name: string; email: string }): ServiceRequest[] {
  const me = { name: user.name, kind: 'persona' as const, contact: user.name, email: user.email };
  const mocks = [
    mock('demo-c1', '2', { id: '2', name: 'María López', kind: 'persona' }, me, ['casas'], 'departamento', 70, '2026-12-03', 'aceptada'),
    mock('demo-c2', '12', { id: '12', name: 'Hogar Brillante', kind: 'equipo' }, me, ['profunda', 'ventanas'], 'vacacional', 90, '2026-11-27', 'pendiente'),
    mock('demo-c3', '20', { id: '20', name: 'Equipo Cristal', kind: 'equipo' }, me, ['oficinas', 'ventanas'], 'oficina', 120, '2026-11-10', 'finalizada'),
    mock('demo-c4', '17', { id: '17', name: 'Sofía Torres', kind: 'persona' }, me, ['profunda'], 'casa', 95, '2026-10-18', 'finalizada'),
  ];
  const mine = loadLocal().filter((r) => normalize(r.client.email) === normalize(user.email));
  return withStatuses([...mine, ...mocks]).sort(byNewest);
}

/**
 * Servicios que presta un proveedor: clientes de prueba (personas, empresas e instituciones)
 * y las solicitudes hechas en este navegador a un proveedor con el mismo nombre.
 * Las de prueba se cotizan con los precios de "Brillo Total" (id 1).
 */
export function requestsForProvider(user: { name: string }): ServiceRequest[] {
  const me = { id: 'yo', name: user.name, kind: 'empresa' as const };
  const mocks = [
    mock('demo-p1', '1', me, { name: 'Corporativo Vía Corta S.A. de C.V.', kind: 'empresa', contact: 'Laura Méndez', email: 'compras@viacorta.mx', phone: '664 123 4567' }, ['oficinas'], 'oficina', 450, '2026-11-28', 'aceptada'),
    mock('demo-p2', '1', me, { name: 'Colegio Montessori del Pacífico', kind: 'institucion', contact: 'Mtro. Ricardo Salas', email: 'administracion@montessoripacifico.edu.mx', phone: '664 615 2290' }, ['profunda'], 'escuela', 600, '2026-12-06', 'pendiente'),
    mock('demo-p3', '1', me, { name: 'Clínica Dental Sonrisa', kind: 'empresa', contact: 'Dra. Paola Ríos', email: 'contacto@sonrisatj.mx', phone: '664 312 4455' }, ['profunda'], 'consultorio', 90, '2026-11-26', 'aceptada'),
    mock('demo-p4', '1', me, { name: 'Andrea Villalobos', kind: 'persona', contact: 'Andrea Villalobos', email: 'andrea.villalobos@correo.com', phone: '664 987 6543' }, ['profunda'], 'casa', 110, '2026-12-02', 'pendiente'),
    mock('demo-p5', '1', me, { name: 'Ayuntamiento de Tijuana – Palacio Municipal', kind: 'institucion', contact: 'Lic. Andrés Pineda', email: 'servicios.generales@tijuana.gob.mx', phone: '664 973 7000' }, ['post-obra'], 'oficina', 780, '2026-10-30', 'finalizada'),
    mock('demo-p6', '1', me, { name: 'Bodegas Frontera Logística', kind: 'empresa', contact: 'Ing. Marco Ibarra', email: 'operaciones@fronteralog.mx', phone: '664 200 8811' }, ['profunda'], 'bodega', 700, '2026-11-12', 'finalizada'),
  ];
  const mine = loadLocal().filter((r) => normalize(r.provider.name) === normalize(user.name));
  return withStatuses([...mine, ...mocks]).sort(byNewest);
}
