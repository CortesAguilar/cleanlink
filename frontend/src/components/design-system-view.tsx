import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { componentDemos } from '../design-system/component-demos';
import { colors, fonts, groupBy, radii, shadows, spacing, textStyles } from '../design-system/parse-tokens';
import * as components from './index';
import { Logo } from './logo';

const sections = [
  ['colores', 'Colores'],
  ['tipografia', 'Tipografía'],
  ['espaciado', 'Espaciado'],
  ['radios', 'Radios'],
  ['sombras', 'Sombras'],
  ['componentes', 'Componentes'],
];

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-title">{title}</h2>
        {intro && <p className="max-w-3xl text-body text-ink-muted">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function TokenName({ children }: { children: ReactNode }) {
  return <code className="text-label">{children}</code>;
}

function ThemeSwitch() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div role="group" aria-label="Tema" className="flex rounded-md border border-line bg-surface-raised p-1">
      {(
        [
          ['light', 'Claro'],
          ['dark', 'Oscuro'],
          ['system', 'Sistema'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          onClick={() => setTheme(value)}
          className="min-h-9 cursor-pointer rounded-sm px-3 text-label text-ink-muted aria-pressed:bg-primary aria-pressed:text-on-primary"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Colors() {
  return groupBy(colors).map(([group, items]) => (
    <div key={group} className="flex flex-col gap-3">
      <h3 className="text-heading">{group}</h3>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {items.map((c) => (
          <div key={c.key} className="flex flex-col overflow-hidden rounded-md border border-line bg-surface-raised">
            <div className="h-20 border-b border-line" style={{ background: `var(${c.name})` }} />
            <div className="flex flex-col gap-1 p-3">
              <TokenName>{c.key}</TokenName>
              <span className="text-caption text-ink-muted">
                {c.light === c.dark ? c.light : `${c.light} · ${c.dark}`}
              </span>
              <span className="text-body-sm">{c.usage}</span>
              <code className="text-caption text-ink-muted">bg-{c.key} · text-{c.key}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  ));
}

function Typography() {
  return (
    <>
      {fonts.map((f) => (
        <div key={f.key} className="flex flex-col gap-3 rounded-lg border border-line bg-surface-raised p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <TokenName>font-{f.key}</TokenName>
            <span className="text-body-sm text-ink-muted">{f.usage}</span>
          </div>
          <span className="text-display" style={{ fontFamily: `var(${f.name})` }}>
            {f.value.split(',')[0].replaceAll("'", '')}
          </span>
          <div className="flex flex-wrap gap-6 text-heading">
            {[400, 500, 600, 700].map((w) => (
              <span key={w} style={{ fontWeight: w }}>
                Aa {w}
              </span>
            ))}
          </div>
          <code className="text-caption text-ink-muted">{f.value}</code>
        </div>
      ))}
      <div className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface-raised">
        {textStyles.map((t) => (
          <div key={t.key} className="grid gap-2 p-6 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col gap-1">
              <TokenName>text-{t.key}</TokenName>
              <span className="text-caption text-ink-muted">
                {t.value} / {t.lineHeight} · {t.fontWeight}
                {t.letterSpacing && ` · ${t.letterSpacing}`}
              </span>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span
                style={{
                  fontSize: t.value,
                  lineHeight: t.lineHeight,
                  fontWeight: t.fontWeight,
                  letterSpacing: t.letterSpacing,
                }}
              >
                Limpieza confiable, cerca de ti
              </span>
              <span className="text-body-sm text-ink-muted">{t.usage}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Spacing() {
  return (
    <div className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface-raised">
      {spacing.map((s) => (
        <div key={s.key} className="grid items-center gap-2 p-4 md:grid-cols-[160px_160px_1fr]">
          <div className="flex flex-col">
            <TokenName>{`p-${s.key} · gap-${s.key}`}</TokenName>
            <span className="text-caption text-ink-muted">{s.value}</span>
          </div>
          <div className="h-6 rounded-sm bg-primary-bright" style={{ width: s.value }} />
          <span className="text-body-sm">{s.usage}</span>
        </div>
      ))}
    </div>
  );
}

function Radii() {
  const all = [...radii, { key: 'full', value: '9999px', usage: 'Chips, badges, avatares.', name: '--radius-full' }];
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
      {all.map((r) => (
        <div key={r.key} className="flex flex-col gap-3">
          <div
            className="h-24 border-2 border-primary bg-primary-soft"
            style={{ borderRadius: r.key === 'full' ? r.value : `var(${r.name})` }}
          />
          <TokenName>rounded-{r.key}</TokenName>
          <span className="text-caption text-ink-muted">{r.value}</span>
          <span className="text-body-sm">{r.usage}</span>
        </div>
      ))}
    </div>
  );
}

function Shadows() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-6">
      {shadows.map((s) => (
        <div key={s.key} className="flex flex-col gap-3">
          <div className="h-28 rounded-lg bg-surface-raised" style={{ boxShadow: `var(${s.name})` }} />
          <TokenName>shadow-{s.key}</TokenName>
          <span className="text-body-sm">{s.usage}</span>
        </div>
      ))}
    </div>
  );
}

function Components() {
  const exported = Object.keys(components);
  const missing = exported.filter((name) => !componentDemos[name]);
  const shown = Object.keys(componentDemos).filter((name) => exported.includes(name));

  return (
    <>
      {missing.length > 0 && (
        <div role="alert" className="rounded-md bg-warning p-4 text-body-sm text-on-warning">
          Componentes sin muestra en component-demos.jsx: <strong>{missing.join(', ')}</strong>
        </div>
      )}
      {shown.map((name) => {
        const demo = componentDemos[name];
        return (
          <article key={name} className="flex flex-col gap-4 rounded-lg border border-line bg-surface-raised p-6">
            <header className="flex flex-col gap-1">
              <div className="flex flex-wrap items-baseline gap-3">
                <h3 className="text-heading">{name}</h3>
                <code className="text-caption text-ink-muted">components/{demo.file}</code>
              </div>
              <p className="text-body-sm text-ink-muted">{demo.description}</p>
            </header>
            <div className="rounded-md bg-surface p-6">{demo.render()}</div>
          </article>
        );
      })}
    </>
  );
}

/** Design system pintado a partir de src/index.css y src/components. */
export function DesignSystemView() {
  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 border-b border-line bg-surface-raised/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 md:px-6">
          <div className="flex items-baseline gap-2">
            <Logo href="#" />
            <span className="text-label text-ink-muted">Design system</span>
          </div>
          <nav aria-label="Secciones" className="flex flex-wrap gap-4 text-label">
            {sections.map(([id, title]) => (
              <a key={id} href={`#${id}`} className="text-ink-muted no-underline hover:text-primary">
                {title}
              </a>
            ))}
          </nav>
          <div className="ml-auto">
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-12 md:px-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-display">Design system</h1>
          <p className="max-w-3xl text-body text-ink-muted">
            Fresca, confiable y cercana. Tokens leídos de <code>src/index.css</code> y componentes reales de{' '}
            <code>src/components/</code>: esta página siempre muestra lo que hay en el código.
          </p>
        </div>

        <Section
          id="colores"
          title="Colores"
          intro="Valores en tema claro · oscuro. Persona usa la familia primary; Grupo, la familia secondary. Los estados solo comunican estado."
        >
          <Colors />
        </Section>

        <Section id="tipografia" title="Tipografía" intro="Una sola familia. Cada clase text-* ya trae tamaño, interlineado, peso y tracking.">
          <Typography />
        </Section>

        <Section id="espaciado" title="Espaciado" intro="Base de 4px. El aire también comunica limpieza.">
          <Spacing />
        </Section>

        <Section id="radios" title="Radios" intro="Suave y redondeado: nada con esquina viva.">
          <Radii />
        </Section>

        <Section id="sombras" title="Sombras" intro="Tenues, con tinte turquesa en claro; una tarjeta en reposo puede usar solo el borde line.">
          <Shadows />
        </Section>

        <Section id="componentes" title="Componentes" intro="Un componente por archivo, en src/components/.">
          <Components />
        </Section>
      </main>
    </div>
  );
}
