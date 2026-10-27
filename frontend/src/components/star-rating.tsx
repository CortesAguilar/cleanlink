import type { StarValue } from '../types/provider';
import { Icon } from './icon';

type StarRatingProps = {
  value: StarValue;
  size?: number;
};

/** Cinco estrellas; se rellenan tantas como indique `value` (0 a 5, sin medias). */
export function StarRating({ value, size = 18 }: StarRatingProps) {
  return (
    <span role="img" aria-label={`${value} de 5 estrellas`} className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="star"
          size={size}
          filled={star <= value}
          className={star <= value ? 'text-warning' : 'text-line'}
        />
      ))}
    </span>
  );
}
