import css from '../index.css?raw';

type Declaration = {
  name: string;
  value: string;
  usage: string;
  group: string;
};

export type Token = Declaration & {
  /** Nombre sin el prefijo: `--color-primary` → `primary`. */
  key: string;
  light: string;
  dark: string;
};

export type TextStyle = Token & {
  lineHeight?: string;
  fontWeight: string;
  letterSpacing?: string;
};

/** Texto dentro de las llaves del primer bloque que empieza con `header`. */
function blockAfter(header: string): string {
  const start = css.indexOf(header);
  if (start === -1) return '';
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return '';
}

const groupComment = /^\s*\/\*\s*(.+?)\s*\*\/\s*$/;
const declaration = /^\s*(--[\w-]+):\s*(.+?);\s*(?:\/\*\s*(.*?)\s*\*\/)?\s*$/;

/** Declaraciones de un bloque con su grupo (comentario previo) y nota de uso. */
function declarations(block: string): Declaration[] {
  const result: Declaration[] = [];
  let group = '';
  for (const line of block.split('\n')) {
    const g = line.match(groupComment);
    if (g) {
      group = g[1];
      continue;
    }
    const d = line.match(declaration);
    if (d) result.push({ name: d[1], value: d[2], usage: d[3] ?? '', group });
  }
  return result;
}

function toMap(decls: Declaration[]): Record<string, string> {
  return Object.fromEntries(decls.map((d) => [d.name, d.value]));
}

const light = toMap(declarations(blockAfter(':root {')));
const dark = toMap(declarations(blockAfter(":root[data-theme='dark'] {")));
const themed = [...declarations(blockAfter('@theme inline {')), ...declarations(blockAfter('@theme {'))];

/** Resuelve `var(--cl-x)` a sus valores de tema claro y oscuro. */
function resolve(value: string): { light: string; dark: string } {
  const ref = value.match(/^var\((--cl-[\w-]+)\)$/);
  if (!ref) return { light: value, dark: value };
  return { light: light[ref[1]], dark: dark[ref[1]] ?? light[ref[1]] };
}

function byPrefix(prefix: string): Token[] {
  return themed
    .filter((d) => d.name.startsWith(prefix))
    .map((d) => ({ ...d, key: d.name.slice(prefix.length), ...resolve(d.value) }));
}

/** Agrupa una lista por su campo `group`, conservando el orden del CSS. */
export function groupBy<T extends { group: string }>(items: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    if (!groups.has(item.group)) groups.set(item.group, []);
    groups.get(item.group)!.push(item);
  }
  return [...groups.entries()];
}

export const colors = byPrefix('--color-');
export const shadows = byPrefix('--shadow-');
export const radii = byPrefix('--radius-');
export const spacing = byPrefix('--spacing-');
export const fonts = byPrefix('--font-');

/** Estilos de texto: `--text-x` con sus subpropiedades `--text-x--line-height`, etc. */
export const textStyles: TextStyle[] = byPrefix('--text-')
  .filter((d) => !d.key.includes('--'))
  .map((style) => {
    const sub = (prop: string) => themed.find((d) => d.name === `--text-${style.key}--${prop}`)?.value;
    return {
      ...style,
      lineHeight: sub('line-height'),
      fontWeight: sub('font-weight') ?? '400',
      letterSpacing: sub('letter-spacing'),
    };
  });
