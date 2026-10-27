import type { Schedule, Weekday } from '../types/provider';

const weekdays: Weekday[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];

const dayLabels: Record<Weekday, string> = {
  lun: 'lun',
  mar: 'mar',
  mie: 'mié',
  jue: 'jue',
  vie: 'vie',
  sab: 'sáb',
  dom: 'dom',
};

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Días como rango si son seguidos ("Lun–sáb") o como lista ("Lun, mié, vie"). */
function formatDays(days: Weekday[]) {
  const sorted = weekdays.filter((d) => days.includes(d));
  if (sorted.length === 7) return 'Todos los días';
  const first = weekdays.indexOf(sorted[0]);
  const consecutive = sorted.every((d, i) => weekdays.indexOf(d) === first + i);
  const text =
    consecutive && sorted.length > 2
      ? `${dayLabels[sorted[0]]}–${dayLabels[sorted[sorted.length - 1]]}`
      : sorted.map((d) => dayLabels[d]).join(', ');
  return capitalize(text);
}

/** Texto visible del horario de atención. */
export function formatSchedule(schedule: Schedule) {
  switch (schedule.mode) {
    case 'siempre':
      return 'Disponible siempre';
    case 'sin-definir':
      return 'Horario sin definir';
    case 'definido':
      return `${formatDays(schedule.days)} · ${schedule.from}–${schedule.to}`;
  }
}
