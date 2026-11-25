import { Card } from './card';
import { Icon } from './icon';

type Step = {
  icon: string;
  title: string;
  text: string;
};

type Track = {
  icon: string;
  title: string;
  intro: string;
  steps: Step[];
};

// Pasos basados en las reglas de producto (ANOTACIONES.txt): buscar sin sesión,
// cotización por m², contratar con sesión y solo cuentas verificadas publican.
const tracks: Track[] = [
  {
    icon: 'search',
    title: 'Si buscas limpieza',
    intro: 'Para casas, oficinas, locales y más.',
    steps: [
      {
        icon: 'travel_explore',
        title: 'Busca y compara',
        text: 'Explora personas, equipos y empresas sin crear cuenta. Filtra por servicio, disponibilidad y calificación.',
      },
      {
        icon: 'request_quote',
        title: 'Cotiza al momento',
        text: 'Elige el servicio, el tipo de espacio y los metros cuadrados, y ve el precio final con IVA incluido.',
      },
      {
        icon: 'handshake',
        title: 'Contrata y califica',
        text: 'Inicia sesión para solicitar el servicio. Al terminar, deja tu calificación para ayudar a otros.',
      },
    ],
  },
  {
    icon: 'cleaning_services',
    title: 'Si ofreces limpieza',
    intro: 'Trabajes solo, en equipo o como empresa.',
    steps: [
      {
        icon: 'badge',
        title: 'Crea tu perfil',
        text: 'Elige si eres persona, equipo o empresa, y agrega los servicios que ofreces.',
      },
      {
        icon: 'verified',
        title: 'Verifica tu cuenta',
        text: 'Solo las cuentas verificadas pueden publicar, así los clientes saben que pueden confiar en ti.',
      },
      {
        icon: 'notifications_active',
        title: 'Recibe solicitudes',
        text: 'Pon tu precio por metro cuadrado y recibe solicitudes de clientes que ya conocen el costo.',
      },
    ],
  },
];

function TrackCard({ track }: { track: Track }) {
  return (
    <Card padding="lg" className="min-w-0 flex-[1_1_420px] gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-md bg-primary text-on-primary">
          <Icon name={track.icon} size={24} />
        </span>
        <div className="flex flex-col">
          <h3 className="text-heading">{track.title}</h3>
          <p className="text-body-sm text-ink-muted">{track.intro}</p>
        </div>
      </div>

      <ol className="flex flex-col">
        {track.steps.map((step, index) => {
          const isLast = index === track.steps.length - 1;
          return (
            <li key={step.title} className="flex gap-4">
              {/* Número del paso con una línea que lo une al siguiente */}
              <div className="flex flex-col items-center">
                <span className="flex size-10 flex-none items-center justify-center rounded-md bg-primary-soft text-label text-on-primary-soft">
                  {index + 1}
                </span>
                {!isLast && <span aria-hidden="true" className="w-0.5 flex-1 bg-line" />}
              </div>
              <div className={`flex min-w-0 flex-col gap-1 pt-2 ${isLast ? '' : 'pb-6'}`}>
                <div className="flex items-center gap-2">
                  <Icon name={step.icon} size={20} className="text-primary" />
                  <h4 className="text-body font-semibold">{step.title}</h4>
                </div>
                <p className="text-body-sm text-ink-muted">{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/** Sección "Cómo funciona" de la landing: pasos para clientes y para proveedores. */
export function LandingHowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="scroll-mt-4 bg-surface-tint">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-16">
        <div className="flex max-w-[640px] flex-col gap-3">
          <span className="text-label text-primary">Cómo funciona</span>
          <h2 id="como-funciona-titulo" className="text-title md:text-display">
            Limpieza resuelta en tres pasos
          </h2>
          <p className="text-lead text-ink-muted">
            Ya sea que necesites a alguien que limpie o que quieras ofrecer tus servicios, CleanLink te conecta con
            la otra parte de forma clara y segura.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          {tracks.map((track) => (
            <TrackCard key={track.title} track={track} />
          ))}
        </div>
      </div>
    </section>
  );
}
