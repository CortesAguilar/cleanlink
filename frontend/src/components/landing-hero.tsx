import { Avatar } from './avatar';
import { Badge } from './badge';
import { ProfileTypeBadge } from './profile-type-badge';
import { Rating } from './rating';
import { SearchBar, type SearchQuery } from './search-bar';
import { VerifiedLabel } from './verified-label';

const popularSearches = ['Limpieza profunda', 'Oficinas', 'Post-obra'];

type LandingHeroProps = {
  onSearch?: (search: SearchQuery) => void;
};

/** Ilustración del hero: bloques de identidad con burbujas y un perfil de ejemplo. */
function HeroIllustration() {
  return (
    <div aria-hidden="true" className="relative h-[440px] min-w-0 flex-[1_1_420px]">
      <svg viewBox="0 0 520 440" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full">
        <rect x="40" y="0" width="220" height="360" rx="20" className="fill-primary-bright" />
        <rect x="280" y="80" width="200" height="320" rx="20" className="fill-sky" />
        <rect x="40" y="380" width="220" height="40" rx="20" className="fill-primary-soft" />
        <g className="fill-white">
          <circle cx="96" cy="300" r="14" />
          <circle cx="150" cy="256" r="7" />
          <circle cx="104" cy="208" r="5" />
          <circle cx="200" cy="170" r="12" />
          <circle cx="140" cy="120" r="6" />
          <circle cx="216" cy="70" r="4" />
          <circle cx="330" cy="350" r="8" />
          <circle cx="420" cy="320" r="14" />
          <circle cx="440" cy="250" r="5" />
        </g>
      </svg>
      <div className="absolute top-[34%] left-[22%] flex w-[280px] max-w-[70%] flex-col gap-3 rounded-lg bg-surface-raised p-4 shadow-md">
        <div className="flex items-center gap-3">
          <Avatar name="Brillo Total" isGroup />
          <div className="flex min-w-0 flex-col">
            <span className="text-body font-semibold">Brillo Total</span>
            <span className="text-caption text-ink-muted">Equipo de 6 · Zona Río</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProfileTypeBadge isGroup />
          <VerifiedLabel />
          <Rating value={4.9} />
        </div>
      </div>
    </div>
  );
}

/** Primera sección de la página principal: mensaje, buscador y búsquedas populares. */
export function LandingHero({ onSearch }: LandingHeroProps) {
  return (
    <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 pt-16 pb-12">
      <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-6">
        <div className="self-start">
          <Badge tone="persona" icon="verified">
            Personas y grupos verificados
          </Badge>
        </div>
        <h1 className="text-display md:text-hero">
          Limpieza confiable,
          <br />
          cerca de ti
        </h1>
        <p className="max-w-[520px] text-lead text-ink-muted">
          Encuentra a la persona o al equipo ideal para limpiar tu casa u oficina, o crea tu perfil y recibe
          solicitudes de clientes en tu zona.
        </p>

        <SearchBar onSearch={onSearch} />

        <div className="flex flex-wrap items-center gap-2 text-body-sm text-ink-muted">
          <span>Populares:</span>
          {popularSearches.map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => onSearch?.({ query, zone: '' })}
              className="cursor-pointer rounded-full border border-line bg-surface-raised px-3 py-1.5 text-caption font-semibold text-ink transition-colors hover:border-primary"
            >
              {query}
            </button>
          ))}
        </div>
      </div>

      <HeroIllustration />
    </section>
  );
}
