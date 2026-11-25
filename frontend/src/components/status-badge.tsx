import { statusLabels, type RequestStatus } from '../data/service-requests';
import { Badge, type BadgeTone } from './badge';

const tones: Record<RequestStatus, BadgeTone> = {
  pendiente: 'pending',
  aceptada: 'persona',
  finalizada: 'neutral',
};

/** Estado de un servicio: Pendiente (naranja), Aceptada (turquesa) o Finalizada (borde). */
export function StatusBadge({ status }: { status: RequestStatus }) {
  return <Badge tone={tones[status]}>{statusLabels[status]}</Badge>;
}
