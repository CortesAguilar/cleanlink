import {
  Avatar,
  Badge,
  Button,
  Card,
  Check,
  FilterCard,
  Icon,
  Logo,
  AppNavbar,
  PublicNavbar,
  ProfileTypeBadge,
  ProviderCard,
  Rating,
  SearchBar,
  SelectField,
  StarRating,
  SuggestionCard,
  TextArea,
  TextField,
  VerifiedLabel,
} from '../components';
import { ChipDemo } from './chip-demo';
import type { ReactNode } from 'react';

type ComponentDemo = {
  /** Archivo dentro de src/components/. */
  file: string;
  description: string;
  render: () => ReactNode;
};

/*
 * Una muestra por cada componente exportado en components/index.js.
 * La clave es el nombre exportado; si falta alguno, la página lo marca.
 * Al crear o cambiar un componente, actualizar aquí su muestra.
 */

export const componentDemos: Record<string, ComponentDemo> = {
  Button: {
    file: 'button.tsx',
    description: 'variant: primary, secondary (Grupos), outline, ghost · size: md (44px), lg (48px) · solo icono con aria-label · href lo vuelve enlace.',
    render: () => (
      <div className="flex flex-wrap items-center gap-3">
        <Button>Solicitar servicio</Button>
        <Button variant="secondary">Crear perfil de grupo</Button>
        <Button variant="outline" icon="chat">
          Enviar mensaje
        </Button>
        <Button variant="ghost">Cancelar</Button>
        <Button variant="ghost" icon="bookmark" aria-label="Guardar perfil" />
        <Button size="lg">Publicar solicitud</Button>
        <Button disabled>Deshabilitado</Button>
      </div>
    ),
  },
  Badge: {
    file: 'badge.tsx',
    description: 'tone: persona, grupo, success, warning, danger, neutral (servicios). Siempre con texto.',
    render: () => (
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="persona">Persona</Badge>
        <Badge tone="grupo">Grupo</Badge>
        <Badge tone="success" icon="check_circle">
          Completado
        </Badge>
        <Badge tone="warning">Verificación pendiente</Badge>
        <Badge tone="danger">Cancelado</Badge>
        <Badge>Limpieza profunda</Badge>
      </div>
    ),
  },
  ProfileTypeBadge: {
    file: 'profile-type-badge.tsx',
    description: 'Atajo del badge de tipo de perfil a partir de isGroup.',
    render: () => (
      <div className="flex gap-3">
        <ProfileTypeBadge isGroup={false} />
        <ProfileTypeBadge isGroup />
      </div>
    ),
  },
  VerifiedLabel: {
    file: 'verified-label.tsx',
    description: 'Indicador de perfil verificado, sin fondo.',
    render: () => <VerifiedLabel />,
  },
  Rating: {
    file: 'rating.tsx',
    description: 'Estrella rellena en warning + calificación; reseñas opcionales.',
    render: () => (
      <div className="flex flex-wrap items-center gap-6">
        <Rating value={4.9} reviews={128} />
        <Rating value={5} />
      </div>
    ),
  },
  Chip: {
    file: 'chip.tsx',
    description: 'Seleccionable. variant solid para pestañas Todos/Personas/Grupos; soft para filtros y tipo de servicio.',
    render: () => <ChipDemo />,
  },
  Avatar: {
    file: 'avatar.tsx',
    description: 'Iniciales en turquesa (Persona) o azul cielo (Grupo). Acepta src cuando haya foto.',
    render: () => (
      <div className="flex items-center gap-3">
        <Avatar name="María López" size={40} />
        <Avatar name="Rosa Hernández" />
        <Avatar name="Brillo Total" isGroup />
        <Avatar name="Equipo Aqua" isGroup size={64} />
      </div>
    ),
  },
  TextField: {
    file: 'text-field.tsx',
    description: 'Una línea. Etiqueta, icono opcional, hint, error y marca (opcional).',
    render: () => (
      <div className="grid max-w-2xl gap-4">
        <TextField label="Buscar" icon="search" placeholder="¿Qué necesitas limpiar?" />
        <TextField label="Presupuesto" optional placeholder="[TU PRESUPUESTO] MXN" hint="Solo lo verán los proveedores." />
        <TextField label="Correo" type="email" defaultValue="correo@" error="Escribe un correo válido." />
      </div>
    ),
  },
  TextArea: {
    file: 'text-area.tsx',
    description: 'Varias líneas (descripciones, mensajes). Mismas props de etiqueta, hint y error que TextField.',
    render: () => (
      <div className="max-w-2xl">
        <TextArea label="Descripción" rows={3} placeholder="Describe el espacio, qué incluye y cualquier detalle importante." />
      </div>
    ),
  },
  StarRating: {
    file: 'star-rating.tsx',
    description: 'Cinco estrellas, solo valores enteros de 0 a 5 (sin medias). Rellenas en warning, vacías en line.',
    render: () => (
      <div className="flex flex-col gap-2">
        <StarRating value={5} />
        <StarRating value={3} />
        <StarRating value={0} />
      </div>
    ),
  },
  ProviderCard: {
    file: 'provider-card.tsx',
    description: 'Proveedor en resultados: rating con decimal, tipo (Persona, Equipo o Empresa) en texto, reseñas, los 2 servicios destacados y horario de atención. Sin ubicación. Toda la tarjeta es enlace al perfil.',
    render: () => (
      <div className="grid max-w-4xl gap-4 md:grid-cols-2">
        <ProviderCard
          href="#"
          provider={{ id: 'a', name: 'Brillo Total', kind: 'equipo', teamSize: 6, zone: 'Zona Río', rating: 4.9, reviews: 128, verified: true, services: ['profunda', 'oficinas', 'post-obra'], featuredServices: ['profunda', 'oficinas'], schedule: { mode: 'siempre' } }}
        />
        <ProviderCard
          href="#"
          provider={{ id: 'b', name: 'Rosa Hernández', kind: 'persona', zone: 'Centro', rating: 5, reviews: 22, verified: false, services: ['casas', 'mudanzas'], featuredServices: ['casas', 'mudanzas'], schedule: { mode: 'definido', days: ['sab', 'dom'], from: '09:00', to: '18:00' } }}
        />
      </div>
    ),
  },
  SuggestionCard: {
    file: 'suggestion-card.tsx',
    description: 'Proveedor sugerido (Lo más destacado): nombre, Persona/Equipo/Empresa, y estrellas. Recibe un ProviderSummary.',
    render: () => (
      <div className="grid max-w-4xl gap-4 md:grid-cols-2">
        <SuggestionCard provider={{ id: 'a', name: 'Brillo Total', kind: 'equipo', rating: 5 }} />
        <SuggestionCard provider={{ id: 'b', name: 'María López', kind: 'persona', rating: 4 }} />
      </div>
    ),
  },
  SearchBar: {
    file: 'search-bar.tsx',
    description: 'Buscador de servicio + zona, sin sesión. Entrega { query, zone } en onSearch.',
    render: () => (
      <div className="max-w-2xl">
        <SearchBar />
      </div>
    ),
  },
  SelectField: {
    file: 'select-field.tsx',
    description: 'Lista desplegable; options como strings o { value, label }.',
    render: () => (
      <div className="max-w-xs">
        <SelectField label="Zona" options={['Zona Río', 'Otay', 'Playas de Tijuana', 'Centro']} />
      </div>
    ),
  },
  Check: {
    file: 'check.tsx',
    description: 'Checkbox o radio con su etiqueta, en color primary.',
    render: () => (
      <div className="flex flex-col gap-3">
        <Check label="Solo verificados" defaultChecked />
        <Check type="radio" name="demo-rating" label="Cualquiera" />
        <Check type="radio" name="demo-rating" label="4.5 o más" defaultChecked />
      </div>
    ),
  },
  Card: {
    file: 'card.tsx',
    description: 'padding sm/md/lg · elevation flat/raised/floating · tone raised/tint · radius md/lg · as="a" se eleva al pasar el cursor.',
    render: () => (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        <Card as="a" href="#" elevation="raised">
          <div className="flex items-center gap-3">
            <Avatar name="Brillo Total" isGroup />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-body font-semibold">Brillo Total</span>
              <span className="text-caption text-ink-muted">Equipo de 6 · Zona Río</span>
            </div>
            <Rating value={4.9} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProfileTypeBadge isGroup />
            <VerifiedLabel />
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="text-caption text-ink-muted">Disponible esta semana</span>
            <span className="text-label text-primary">Ver perfil</span>
          </div>
        </Card>
        <Card elevation="floating" padding="lg">
          <span className="text-heading">elevation floating</span>
          <span className="text-body-sm text-ink-muted">Menús, modales, vista previa.</span>
        </Card>
        <Card tone="tint" padding="lg">
          <span className="text-heading">¿No encuentras lo que buscas?</span>
          <Button className="self-start">Publicar solicitud</Button>
        </Card>
      </div>
    ),
  },
  FilterCard: {
    file: 'filter-card.tsx',
    description: 'Filtro seleccionable con icono y texto, sin recuadro. Gris en reposo; icono y texto en primary al pasar el cursor o seleccionado.',
    render: () => (
      <div className="grid max-w-2xl grid-cols-2 gap-4 md:grid-cols-4">
        <FilterCard icon="star" label="Mejores calificaciones" selected />
        <FilterCard icon="trending_up" label="Más solicitados" />
        <FilterCard icon="home" label="Limpieza residencial" />
        <FilterCard icon="apartment" label="Limpieza comercial" />
      </div>
    ),
  },
  Icon: {
    file: 'icon.tsx',
    description: 'Material Symbols Outlined. 16px en chips, 20px en navegación y formularios, 24px en tarjetas. filled solo para la estrella.',
    render: () => (
      <div className="flex flex-wrap items-center gap-5 text-ink-muted">
        {['search', 'location_on', 'verified', 'person', 'group', 'cleaning_services', 'calendar_month', 'chat', 'notifications'].map(
          (name) => (
            <span key={name} className="flex flex-col items-center gap-1">
              <Icon name={name} size={24} />
              <code className="text-caption">{name}</code>
            </span>
          ),
        )}
        <span className="flex flex-col items-center gap-1">
          <Icon name="star" size={24} filled className="text-warning" />
          <code className="text-caption">star (filled)</code>
        </span>
      </div>
    ),
  },
  PublicNavbar: {
    file: 'public-navbar.tsx',
    description: 'Navegación de la página principal (sin sesión). links con current opcional; en pantallas chicas se vuelve menú desplegable.',
    render: () => (
      <div className="overflow-hidden rounded-md border border-line">
        <PublicNavbar
          links={[
            { label: 'Explorar', href: '#' },
            { label: 'Cómo funciona', href: '#como-funciona' },
            { label: 'Para grupos', href: '#para-quien' },
          ]}
          loginHref="#"
          signupHref="#"
        />
      </div>
    ),
  },
  AppNavbar: {
    file: 'app-navbar.tsx',
    description: 'Navegación dentro de la plataforma (con sesión): logo, notificaciones, perfil y menú. Los iconos aún no despliegan nada.',
    render: () => (
      <div className="overflow-hidden rounded-md border border-line">
        <AppNavbar />
      </div>
    ),
  },
  Logo: {
    file: 'logo.tsx',
    description: 'Nombre de la marca; aún no hay logo gráfico.',
    render: () => <Logo href="#" />,
  },
};
