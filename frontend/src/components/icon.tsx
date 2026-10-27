type IconProps = {
  /** Nombre del símbolo de Material Symbols (search, star, verified...). */
  name: string;
  size?: number;
  filled?: boolean;
  /** Solo si el icono comunica algo por sí solo; sin label es decorativo. */
  label?: string;
  className?: string;
};

/**
 * Icono de Material Symbols Outlined.
 * Decorativo por defecto; pasa `label` si el icono comunica algo por sí solo.
 */
export function Icon({ name, size = 20, filled = false, label, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbol ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
      }}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {name}
    </span>
  );
}
