import { DiaSemana } from '../horarios/horario.entity';
import { fechasClaseEnPeriodo } from './fechas-pase-lista';

describe('Fechas de la lista mensual de una clase', () => {
  const sabados = [
    { dia: DiaSemana.SABADO, activo: true },
    { dia: DiaSemana.LUNES, activo: false },
  ];

  it('genera los días de clase del mes según el horario', () => {
    expect(
      fechasClaseEnPeriodo(sabados, [], '2023-09-01', '2023-09-30'),
    ).toEqual([
      '2023-09-02',
      '2023-09-09',
      '2023-09-16',
      '2023-09-23',
      '2023-09-30',
    ]);
  });

  it('añade días con lista fuera de horario sin duplicar ni salirse del mes', () => {
    expect(
      fechasClaseEnPeriodo(
        sabados,
        ['2023-09-02', '2023-09-13', '2023-10-04'],
        '2023-09-01',
        '2023-09-16',
      ),
    ).toEqual(['2023-09-02', '2023-09-09', '2023-09-13', '2023-09-16']);
  });

  it('sin horario activo solo muestra los días registrados', () => {
    expect(
      fechasClaseEnPeriodo([], ['2023-09-05'], '2023-09-01', '2023-09-30'),
    ).toEqual(['2023-09-05']);
  });
});
