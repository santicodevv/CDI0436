'use client';
import CalendarioEncuentros from '@/components/encuentros/CalendarioEncuentros';
import {
  useEncuentrosSupervivencia,
  useConfigurarEncuentrosSupervivencia,
} from '@/lib/hooks/useSupervivencias';
interface Props {
  supervivenciaId: string;
  mes: string;
  onCambiarMes: (mes: string) => void;
  puedeEditar: boolean;
}
export default function SupervivenciaEncuentros({
  supervivenciaId,
  mes,
  onCambiarMes,
  puedeEditar,
}: Props) {
  const consulta = useEncuentrosSupervivencia(supervivenciaId, mes);
  const mutation = useConfigurarEncuentrosSupervivencia();
  return (
    <CalendarioEncuentros
      key={`${supervivenciaId}-${mes}`}
      recursoId={supervivenciaId}
      mes={mes}
      onCambiarMes={onCambiarMes}
      puedeEditar={puedeEditar}
      consulta={consulta}
      mutation={mutation}
    />
  );
}
