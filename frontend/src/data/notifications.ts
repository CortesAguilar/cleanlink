import type { AccountType } from '../types/tenant';

/** Aviso de la cuenta. Contrato esperado de GET /api/notifications. */
export type AppNotification = {
  id: string;
  /** solicitud (nueva o cambio de estado), recordatorio, calificacion u oferta. */
  kind: 'solicitud' | 'recordatorio' | 'calificacion' | 'oferta';
  title: string;
  body: string;
  /** Fecha y hora ISO en que llegó. */
  createdAt: string;
  /** A dónde lleva al darle clic. */
  href: string;
};

// Datos de prueba mientras no existe la API. Coinciden con las solicitudes de prueba de
// service-requests.ts (mismos ids, nombres, fechas y estados).
// API: reemplazar por GET /api/notifications y PUT /api/notifications/read.

const forProvider: AppNotification[] = [
  {
    id: 'np-1',
    kind: 'solicitud',
    title: 'Nueva solicitud por aceptar',
    body: 'Colegio Montessori del Pacífico pide limpieza profunda de 600 m² para el 6 de diciembre.',
    createdAt: '2026-11-25T09:10:00',
    href: '/panel/servicio?id=demo-p2',
  },
  {
    id: 'np-2',
    kind: 'solicitud',
    title: 'Nueva solicitud por aceptar',
    body: 'Andrea Villalobos pide limpieza profunda de su casa (110 m²) para el 2 de diciembre.',
    createdAt: '2026-11-24T18:40:00',
    href: '/panel/servicio?id=demo-p4',
  },
  {
    id: 'np-3',
    kind: 'recordatorio',
    title: 'Servicio mañana',
    body: 'Limpieza profunda en Clínica Dental Sonrisa el 26 de noviembre. Contacto: Dra. Paola Ríos.',
    createdAt: '2026-11-24T08:00:00',
    href: '/panel/servicio?id=demo-p3',
  },
  {
    id: 'np-4',
    kind: 'calificacion',
    title: 'Recibiste una calificación de 5 estrellas',
    body: 'Bodegas Frontera Logística calificó la limpieza profunda del 12 de noviembre.',
    createdAt: '2026-11-14T12:30:00',
    href: '/panel/servicio?id=demo-p6',
  },
  {
    id: 'np-5',
    kind: 'calificacion',
    title: 'Recibiste una calificación de 4 estrellas',
    body: 'Ayuntamiento de Tijuana calificó la limpieza post-obra del 30 de octubre.',
    createdAt: '2026-11-02T10:15:00',
    href: '/panel/servicio?id=demo-p5',
  },
];

const forClient: AppNotification[] = [
  {
    id: 'nc-1',
    kind: 'recordatorio',
    title: 'Tu solicitud sigue pendiente',
    body: 'Hogar Brillante aún no acepta tu limpieza profunda + ventanas del 27 de noviembre.',
    createdAt: '2026-11-25T08:00:00',
    href: '/mis-servicios/servicio?id=demo-c2',
  },
  {
    id: 'nc-2',
    kind: 'solicitud',
    title: 'María López aceptó tu solicitud',
    body: 'Limpieza de tu departamento (70 m²) confirmada para el 3 de diciembre.',
    createdAt: '2026-11-23T16:20:00',
    href: '/mis-servicios/servicio?id=demo-c1',
  },
  {
    id: 'nc-3',
    kind: 'oferta',
    title: 'Oferta de Equipo Cristal',
    body: '10% de descuento en limpieza de ventanas y fachadas para clientes que repiten, hasta el 15 de diciembre.',
    createdAt: '2026-11-20T11:00:00',
    href: '/proveedor?id=20',
  },
  {
    id: 'nc-4',
    kind: 'solicitud',
    title: 'Servicio finalizado',
    body: 'Equipo Cristal terminó la limpieza de tu oficina (120 m²) del 10 de noviembre.',
    createdAt: '2026-11-10T17:30:00',
    href: '/mis-servicios/servicio?id=demo-c3',
  },
];

export const notificationIcons: Record<AppNotification['kind'], string> = {
  solicitud: 'assignment',
  recordatorio: 'event',
  calificacion: 'star',
  oferta: 'sell',
};

export function notificationsFor(accountType: AccountType): AppNotification[] {
  if (accountType === 'proveedor') return forProvider;
  if (accountType === 'cliente') return forClient;
  return [];
}

// Leídas: se guardan en este navegador. API: PUT /api/notifications/read.
const READ_KEY = 'cleanlink.notifications-read';

export function readNotificationIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markNotificationsRead(ids: string[]) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...new Set([...readNotificationIds(), ...ids])]));
  } catch {
    // Sin almacenamiento: vuelven a salir como nuevas al recargar.
  }
}

/** "Hace 2 h", "Ayer", "20 nov". */
export function timeAgo(iso: string, now = new Date()) {
  const date = new Date(iso);
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24 && date.getDate() === now.getDate()) return `Hace ${hours} h`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
