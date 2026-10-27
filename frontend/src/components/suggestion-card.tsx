import { providerKindLabels } from '../data/provider-kinds';
import type { ProviderSummary } from '../types/provider';
import { Avatar } from './avatar';
import { Badge } from './badge';
import { StarRating } from './star-rating';

type SuggestionCardProps = {
  provider: ProviderSummary;
};

/** Proveedor sugerido: nombre, si es persona, equipo o empresa, y calificación en estrellas. */
export function SuggestionCard({ provider }: SuggestionCardProps) {
  const isGroup = provider.kind !== 'persona';

  return (
    <article className="flex items-center gap-4 rounded-lg border border-line bg-surface-raised p-4 shadow-sm">
      <Avatar name={provider.name} isGroup={isGroup} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="truncate text-body font-semibold">{provider.name}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Badge tone={isGroup ? 'grupo' : 'persona'}>{providerKindLabels[provider.kind]}</Badge>
          <StarRating value={provider.rating} />
        </div>
      </div>
    </article>
  );
}
