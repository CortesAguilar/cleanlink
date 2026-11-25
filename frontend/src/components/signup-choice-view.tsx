import { Card } from './card';
import { Icon } from './icon';
import { PublicNavbar } from './public-navbar';

const links = [{ label: 'Explorar', href: '/' }];

type Option = {
  href: string;
  icon: string;
  title: string;
  text: string;
  points: string[];
};

// Cliente y proveedor se eligen al registrarse y no cambian (ANOTACIONES-BACKEND.txt).
const options: Option[] = [
  {
    href: '/registro/cliente',
    icon: 'search',
    title: 'Busco limpieza',
    text: 'Para tu casa, oficina o negocio.',
    points: ['Cotiza al momento por metro cuadrado', 'Contrata personas, equipos o empresas', 'Califica el servicio'],
  },
  {
    href: '/registro/proveedor',
    icon: 'cleaning_services',
    title: 'Ofrezco limpieza',
    text: 'Trabajes solo, en equipo o como empresa.',
    points: ['Publica tus servicios y precios', 'Recibe solicitudes de clientes', 'Administra tu negocio'],
  },
];

/** Primer paso de "Crear cuenta": elegir entre cuenta de cliente o de proveedor. */
export function SignupChoiceView() {
  return (
    <div className="min-h-svh">
      <PublicNavbar links={links} loginHref="/login" signupHref="/registro" />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-16">
        <div className="flex flex-col gap-2">
          <h1 className="text-title">Crear cuenta</h1>
          <p className="text-body text-ink-muted">
            ¿Cómo quieres usar CleanLink? El tipo de cuenta no se puede cambiar después; si quieres hacer las dos
            cosas, necesitas una cuenta para cada una.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          {options.map((option) => (
            <Card
              key={option.href}
              as="a"
              href={option.href}
              padding="lg"
              className="group min-w-0 flex-[1_1_320px] gap-5 border-line hover:border-primary"
            >
              <span className="flex size-12 items-center justify-center rounded-md bg-primary text-on-primary">
                <Icon name={option.icon} size={24} />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-heading">{option.title}</h2>
                <p className="text-body-sm text-ink-muted">{option.text}</p>
              </div>
              <ul className="flex flex-col gap-2">
                {option.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-body-sm">
                    <Icon name="check_circle" size={18} className="text-success" />
                    {point}
                  </li>
                ))}
              </ul>
              <span className="mt-auto flex items-center gap-1 text-label text-primary">
                Continuar
                <Icon name="arrow_forward" size={18} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Card>
          ))}
        </div>

        <p className="text-body-sm text-ink-muted">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-primary">
            Inicia sesión
          </a>
        </p>
      </main>
    </div>
  );
}
