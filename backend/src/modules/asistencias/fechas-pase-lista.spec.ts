import { BadRequestException } from '@nestjs/common';
import { DiaSemana } from '../horarios/horario.entity';
import { fechasSinListaClase, validarPeriodoTutor } from './fechas-pase-lista';

describe('Fechas sin pase de lista por clase', () => {
  const horarios = [
    { dia: DiaSemana.MIERCOLES, activo: true },
    { dia: DiaSemana.MIERCOLES, activo: true },
    { dia: DiaSemana.JUEVES, activo: true },
    { dia: DiaSemana.SABADO, activo: false },
  ];
  const creacion = new Date('2026-10-01T12:00:00Z');

  it('muestra únicamente fechas programadas sin registros, sin duplicar horarios', () => {
    expect(
      fechasSinListaClase(
        horarios,
        ['2026-10-01', '2026-10-07', '2026-10-15'],
        creacion,
        '2026-10-01',
        '2026-10-31',
        '2026-10-24',
      ),
    ).toEqual(['2026-10-08', '2026-10-14', '2026-10-21', '2026-10-22']);
  });
  it('respeta un día o un rango concreto', () => {
    expect(
      fechasSinListaClase(
        horarios,
        [],
        creacion,
        '2026-10-14',
        '2026-10-14',
        '2026-10-24',
      ),
    ).toEqual(['2026-10-14']);
    expect(
      fechasSinListaClase(
        horarios,
        ['2026-10-21'],
        creacion,
        '2026-10-19',
        '2026-10-25',
        '2026-10-24',
      ),
    ).toEqual(['2026-10-22']);
  });
  it('el historial completo empieza en la creación y no incluye hoy ni fechas futuras', () => {
    expect(
      fechasSinListaClase(
        horarios,
        [],
        new Date('2026-10-20T12:00:00Z'),
        undefined,
        undefined,
        '2026-10-22',
      ),
    ).toEqual(['2026-10-21']);
  });
  it('no genera omisiones para días libres, horarios inactivos o clases futuras', () => {
    expect(
      fechasSinListaClase([], [], creacion, undefined, undefined, '2026-10-24'),
    ).toEqual([]);
    expect(
      fechasSinListaClase(
        [{ dia: DiaSemana.MIERCOLES, activo: false }],
        [],
        creacion,
        undefined,
        undefined,
        '2026-10-24',
      ),
    ).toEqual([]);
    expect(
      fechasSinListaClase(
        horarios,
        [],
        new Date('2026-11-01T00:00:00Z'),
        undefined,
        undefined,
        '2026-10-24',
      ),
    ).toEqual([]);
  });
  it('acepta filtros abiertos y excluye fechas anteriores a la creación', () => {
    expect(
      fechasSinListaClase(
        horarios,
        [],
        creacion,
        undefined,
        '2026-10-01',
        '2026-10-24',
      ),
    ).toEqual(['2026-10-01']);
    expect(
      fechasSinListaClase(
        horarios,
        [],
        creacion,
        '2026-09-01',
        '2026-10-01',
        '2026-10-24',
      ),
    ).toEqual(['2026-10-01']);
    expect(() => validarPeriodoTutor(undefined, '2026-10-01')).not.toThrow();
  });
  it.each([
    ['2026-10-30', '2026-10-01'],
    ['2026-02-30', '2026-03-01'],
    ['inválida', undefined],
    ['', undefined],
    ['0000-10-01', undefined],
  ])('rechaza un período inválido: %s / %s', (inicio, fin) => {
    expect(() => validarPeriodoTutor(inicio, fin)).toThrow(BadRequestException);
  });
});
