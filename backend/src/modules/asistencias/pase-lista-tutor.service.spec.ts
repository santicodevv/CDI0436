import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  clasificarPaseLista,
  PaseListaTutorService,
} from './pase-lista-tutor.service';

describe('Pase de lista del tutor', () => {
  it.each([
    ['2026-10-07', 0, 20, 'sin_registro'],
    ['2026-10-07', 1, 20, 'parcial'],
    ['2026-10-07', 20, 20, 'registrada'],
    ['2026-10-24', 0, 20, 'pendiente_hoy'],
    ['2026-10-28', 0, 20, 'programada'],
  ] as const)(
    'clasifica %s con %i registros',
    (fecha, registrados, inscritos, estado) => {
      expect(
        clasificarPaseLista(fecha, registrados, inscritos, '2026-10-24'),
      ).toBe(estado);
    },
  );

  const findOne = jest.fn();
  const query = jest.fn();
  const service = new PaseListaTutorService({
    getRepository: () => ({ findOne }),
    query,
  } as unknown as DataSource);
  beforeEach(() => {
    jest.clearAllMocks();
    findOne.mockResolvedValue({
      id: 'tutor',
      nombre: 'Ana',
      apellido: 'Pérez',
    });
  });

  it.each([
    { fechaInicio: '2026-10-10', fechaFin: '2026-10-01' },
    { fechaInicio: '2026-02-30', fechaFin: '2026-03-01' },
    { fechaInicio: '2024-01-01', fechaFin: '2026-10-01' },
    { fechaInicio: 'incorrecta', fechaFin: '2026-10-01' },
  ])('rechaza rangos inválidos: %j', async (filtros) => {
    await expect(service.generar('tutor', filtros)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('no consulta registros de un tutor inexistente', async () => {
    findOne.mockResolvedValue(null);
    await expect(
      service.generar('otro', {
        fechaInicio: '2026-10-01',
        fechaFin: '2026-10-31',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(query).not.toHaveBeenCalled();
  });

  it('cuenta días únicos y distingue dos actividades sin lista el mismo día', async () => {
    query.mockResolvedValue([
      {
        fecha: '2020-10-07',
        tipo: 'clase',
        actividadId: 'a',
        actividad: 'Clase A',
        codigo: null,
        inscritos: 2,
        registrados: 0,
      },
      {
        fecha: '2020-10-07',
        tipo: 'club',
        actividadId: 'b',
        actividad: 'Club B',
        codigo: null,
        inscritos: 2,
        registrados: 0,
      },
      {
        fecha: '2020-10-08',
        tipo: 'supervivencia',
        actividadId: 'c',
        actividad: 'Curso C',
        codigo: null,
        inscritos: 2,
        registrados: 1,
      },
    ]);
    const reporte = await service.generar('tutor', {
      fechaInicio: '2020-10-01',
      fechaFin: '2020-10-31',
    });
    expect(reporte.estadisticas).toMatchObject({
      diasSinRegistro: 1,
      sesionesSinRegistro: 2,
      sesionesParciales: 1,
    });
    expect(query).toHaveBeenCalledWith(expect.any(String), [
      'tutor',
      '2020-10-01',
      '2020-10-31',
    ]);
  });
});
