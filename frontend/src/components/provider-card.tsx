import { providerKindLabels } from '../data/provider-kinds';
import { formatSchedule } from '../data/schedule';
import { services } from '../data/services';
import type { ProviderListing } from '../types/provider';
import { Avatar } from './avatar';
import { Badge } from './badge';
import { Card } from './card';
import { Rating } from './rating';

type ProviderCardProps = {
  provider: ProviderListing;
  href: string;
};

/**
 * Tarjeta de proveedor en resultados: tipo (persona, equipo o empresa), reseñas, los 2
 * servicios destacados y horario de atención. La ubicación no se muestra: el proveedor va a donde lo piden.
 */
export function ProviderCard({ provider, href }: ProviderCardProps) {
  const isGroup = provider.kind !== 'persona';

  return (
    <Card as="a" href={href} elevation="raised" radius="md" className="h-full">
      <div className="flex items-center gap-3">
        <Avatar name={provider.name} isGroup={isGroup} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body font-semibold">{provider.name}</span>
          <span className="text-caption text-ink-muted">
            {providerKindLabels[provider.kind]} · {provider.reviews} reseñas
          </span>
        </div>
        <Rating value={provider.rating} />
      </div>

      <div className="flex flex-wrap gap-2">
        {provider.featuredServices.slice(0, 2).map((id) => (
          <Badge key={id}>{services.find((s) => s.id === id)?.short}</Badge>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
        <span className="text-caption text-ink-muted">{formatSchedule(provider.schedule)}</span>
        <span className="text-label text-primary">Ver perfil</span>
      </div>
    </Card>
  );
}
