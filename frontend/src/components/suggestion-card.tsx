import { providerKindLabels } from '../data/provider-kinds';
import { services } from '../data/services';
import type { ProviderSummary } from '../types/provider';
import { Avatar } from './avatar';
import { Card } from './card';
import { Rating } from './rating';

type SuggestionCardProps = {
  provider: ProviderSummary;
  /** A dónde lleva la tarjeta (el perfil del proveedor). */
  href: string;
};

/**
 * Proveedor sugerido (Lo más destacado). Nombre y, en una línea: Persona/Equipo/Empresa,
 * su servicio destacado y la calificación (una estrella + número, como en resultados).
 * Toda la tarjeta es enlace al perfil.
 */
export function SuggestionCard({ provider, href }: SuggestionCardProps) {
  const service = services.find((s) => s.id === provider.featuredService);

  return (
    <Card as="a" href={href} padding="sm">
      <div className="flex items-center gap-4">
        <Avatar name={provider.name} isGroup={provider.kind !== 'persona'} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-body font-semibold">{provider.name}</h3>
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-body-sm text-ink-muted">
              {providerKindLabels[provider.kind]}
              {service && ` · ${service.label}`}
            </span>
            <Rating value={provider.rating} />
          </div>
        </div>
      </div>
    </Card>
  );
}
