type AvatarProps = {
  name: string;
  isGroup?: boolean;
  size?: number;
  /** URL de la foto; sin ella se muestran las iniciales. */
  src?: string;
};

/**
 * Avatar con iniciales. Turquesa para Persona, azul cielo para Grupo.
 * Sin foto todavía; cuando el backend entregue una URL se puede pasar `src`.
 */
export function Avatar({ name, isGroup = false, size = 48, src }: AvatarProps) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  const className = `inline-flex flex-none items-center justify-center rounded-full object-cover font-bold ${
    isGroup ? 'bg-secondary-soft text-on-secondary-soft' : 'bg-primary-soft text-on-primary-soft'
  }`;
  const style = { width: size, height: size, fontSize: Math.round(size / 3) };

  if (src) {
    return <img src={src} alt={name} className={className} style={style} />;
  }

  return (
    <span className={className} style={style} role="img" aria-label={name}>
      {initials}
    </span>
  );
}
