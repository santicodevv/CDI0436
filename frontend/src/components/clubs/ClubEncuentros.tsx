'use client';
import CalendarioEncuentros from '@/components/encuentros/CalendarioEncuentros';
import {
  useEncuentrosClub,
  useConfigurarEncuentrosClub,
} from '@/lib/hooks/useClubs';
interface Props {
  clubId: string;
  mes: string;
  onCambiarMes: (mes: string) => void;
  puedeEditar: boolean;
}
export default function ClubEncuentros({
  clubId,
  mes,
  onCambiarMes,
  puedeEditar,
}: Props) {
  const consulta = useEncuentrosClub(clubId, mes);
  const mutation = useConfigurarEncuentrosClub();
  return (
    <CalendarioEncuentros
      key={`${clubId}-${mes}`}
      recursoId={clubId}
      mes={mes}
      onCambiarMes={onCambiarMes}
      puedeEditar={puedeEditar}
      consulta={consulta}
      mutation={mutation}
    />
  );
}
