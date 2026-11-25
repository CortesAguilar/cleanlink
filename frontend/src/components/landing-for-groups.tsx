import { providerKindLabels } from '../data/provider-kinds';
import type { ProviderKind } from '../types/provider';
import { Avatar } from './avatar';
import { Badge } from './badge';
import { Button } from './button';
import { Icon } from './icon';
import { Rating } from './rating';
import { VerifiedLabel } from './verified-label';

type Benefit = {
  icon: string;
  title: string;
  text: string;
};

// Basado en las reglas 3, 6 y 7 de ANOTACIONES.txt (tipos, personas por proveedor y cotización).
const benefits: Benefit[] = [
  {
    icon: 'groups',
    title: 'Muestra cuántos son',
    text: 'Un equipo indica su número de personas y una empresa su rango. Así te encuentran los clientes que necesitan más manos.',
  },
  {
    icon: 'apartment',
    title: 'Atiende espacios grandes',
    text: 'Define los metros cuadrados máximos que cubren y recibe solicitudes de oficinas, escuelas, locales y bodegas.',
  },
  {
    icon: 'request_quote',
    title: 'Cotiza sin llamadas',
    text: 'Pon tu precio por metro cuadrado y por tipo de espacio; el cliente ve el costo final antes de solicitar.',
  },
  {
    icon: 'verified',
    title: 'Un perfil para todo el grupo',
    text: 'Las calificaciones y la verificación se suman al nombre del equipo o la empresa, no a una sola persona.',
  },
];

type Example = {
  name: string;
  kind: ProviderKind;
  people: string;
  rating: number;
  services: string[];
};

const examples: Example[] = [
  { name: 'Brillo Total', kind: 'equipo', people: '6 personas', rating: 4.9, services: ['Limpieza profunda', 'Ventanas'] },
  { name: 'Servilimp Norte', kind: 'empresa', people: '5 a 20 personas', rating: 4.7, services: ['Oficinas', 'Post-obra'] },
];

/** Tarjeta de ejemplo de un grupo, como se vería en los resultados. */
function ExampleCard({ example, className = '' }: { example: Example; className?: string }) {
  return (
    <div className={`flex w-[300px] max-w-full flex-col gap-3 rounded-lg border border-line bg-surface-raised p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Avatar name={example.name} isGroup />
        <div className="flex min-w-0 flex-col">
          <span className="text-body font-semibold">{example.name}</span>
          <span className="flex items-center gap-1 text-caption text-ink-muted">
            <Icon name="groups" size={14} />
            {example.people}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="grupo">{providerKindLabels[example.kind]}</Badge>
        <VerifiedLabel />
        <Rating value={example.rating} />
      </div>
      <div className="flex flex-wrap gap-2">
        {example.services.map((service) => (
          <Badge key={service}>{service}</Badge>
        ))}
      </div>
    </div>
  );
}

/** Ilustración: bloques de identidad con dos perfiles de grupo encima. */
function GroupsIllustration() {
  return (
    <div aria-hidden="true" className="relative h-[420px] min-w-0 flex-[1_1_420px]">
      <svg viewBox="0 0 520 420" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full">
        <rect x="260" y="0" width="220" height="340" rx="20" className="fill-sky" />
        <rect x="40" y="60" width="200" height="300" rx="20" className="fill-primary-bright" />
        <rect x="260" y="360" width="220" height="40" rx="20" className="fill-secondary-soft" />
        <g className="fill-white">
          <circle cx="430" cy="60" r="12" />
          <circle cx="380" cy="110" r="5" />
          <circle cx="450" cy="290" r="8" />
          <circle cx="90" cy="320" r="14" />
          <circle cx="190" cy="110" r="6" />
        </g>
      </svg>
      <ExampleCard example={examples[0]} className="absolute top-[10%] left-[6%]" />
      <ExampleCard example={examples[1]} className="absolute right-[4%] bottom-[10%]" />
    </div>
  );
}

/** Sección "Para grupos" de la landing: beneficios para equipos y empresas de limpieza. */
export function LandingForGroups() {
  return (
    <section id="para-quien" aria-labelledby="para-quien-titulo" className="scroll-mt-4">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-12 px-6 py-16">
        <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-8">
          <div className="flex flex-col gap-3">
            <span className="text-label text-secondary">Para grupos</span>
            <h2 id="para-quien-titulo" className="text-title md:text-display">
              ¿Trabajan en equipo o son una empresa?
            </h2>
            <p className="text-lead text-ink-muted">
              CleanLink no es solo para personas. Registra a tu cuadrilla o a tu empresa y consigue trabajos que una
              sola persona no podría cubrir.
            </p>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <li key={benefit.title} className="flex flex-col gap-2">
                <span className="flex size-10 items-center justify-center rounded-md bg-secondary-soft text-on-secondary-soft">
                  <Icon name={benefit.icon} size={22} />
                </span>
                <h3 className="text-body font-semibold">{benefit.title}</h3>
                <p className="text-body-sm text-ink-muted">{benefit.text}</p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="lg" icon="groups" href="/registro/proveedor">
              Registra tu equipo o empresa
            </Button>
          </div>
        </div>

        <GroupsIllustration />
      </div>
    </section>
  );
}
