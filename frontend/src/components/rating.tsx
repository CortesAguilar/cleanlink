import { Icon } from './icon';

type RatingProps = {
  value: number;
  reviews?: number;
};

/**
 * Calificación: estrella rellena en warning + número, y opcionalmente reseñas.
 */
export function Rating({ value, reviews }: RatingProps) {
  return (
    <span className="inline-flex items-center gap-1 text-body-sm">
      <Icon name="star" size={16} filled className="text-warning" />
      <span className="font-semibold">{value.toFixed(1)}</span>
      {reviews !== undefined && (
        <span className="text-caption text-ink-muted">({reviews} reseñas)</span>
      )}
    </span>
  );
}
