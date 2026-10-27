import { Badge } from './badge';

type ProfileTypeBadgeProps = {
  isGroup: boolean;
};

/** Badge del tipo de perfil: "Persona" en turquesa o "Grupo" en azul cielo. */
export function ProfileTypeBadge({ isGroup }: ProfileTypeBadgeProps) {
  return <Badge tone={isGroup ? 'grupo' : 'persona'}>{isGroup ? 'Grupo' : 'Persona'}</Badge>;
}
