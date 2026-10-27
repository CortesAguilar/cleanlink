import { useState } from 'react';
import { Chip } from '../components';

/** Muestra con estado de los dos usos de Chip: pestañas y filtros. */
export function ChipDemo() {
  const [filter, setFilter] = useState('todos');
  const [service, setService] = useState('Limpieza profunda');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {[
          ['todos', 'Todos'],
          ['personas', 'Personas'],
          ['grupos', 'Grupos'],
        ].map(([value, label]) => (
          <Chip key={value} variant="solid" selected={filter === value} onClick={() => setFilter(value)}>
            {label}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {['Casas y departamentos', 'Oficinas y locales', 'Limpieza profunda', 'Post-obra'].map((s) => (
          <Chip key={s} selected={service === s} onClick={() => setService(s)}>
            {s}
          </Chip>
        ))}
      </div>
    </div>
  );
}
