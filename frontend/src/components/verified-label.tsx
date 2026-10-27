import { Icon } from './icon';

/** Indicador "Verificado" en verde, sin fondo, como en las tarjetas de proveedor. */
export function VerifiedLabel() {
  return (
    <span className="inline-flex items-center gap-1 text-caption font-semibold text-success">
      <Icon name="verified" size={14} />
      Verificado
    </span>
  );
}
