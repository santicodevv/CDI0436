import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Between, EntityManager, Repository } from 'typeorm';
import { validate } from 'class-validator';
import { SupervivenciasService } from './supervivencias.service';
import { Supervivencia } from './supervivencia.entity';
import { EncuentroSupervivencia } from './encuentro-supervivencia.entity';
import { AsistenciaSupervivencia } from './asistencia-supervivencia.entity';
import { FotoAsistenciaSupervivencia } from './foto-asistencia-supervivencia.entity';
import { ConfigurarEncuentrosDto } from './dto/configurar-encuentros.dto';

function repositoryMock() {
  const query = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue({ id: 'curso' }),
    getRawMany: jest.fn().mockResolvedValue([]),
  };
  return {
    query,
    createQueryBuilder: jest.fn(() => query),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest
      .fn()
      .mockResolvedValue({ id: 'curso', beneficiarios: [{ id: 'inscrito' }] }),
    exists: jest.fn().mockResolvedValue(true),
    insert: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
  };
}

describe('Encuentros de Supervivencia', () => {
  const curso = repositoryMock();
  const encuentros = repositoryMock();
  const asistencias = repositoryMock();
  const fotos = repositoryMock();
  const repositories = new Map<unknown, ReturnType<typeof repositoryMock>>([
    [Supervivencia, curso],
    [EncuentroSupervivencia, encuentros],
    [AsistenciaSupervivencia, asistencias],
    [FotoAsistenciaSupervivencia, fotos],
  ]);
  const manager = {
    getRepository: jest.fn((entity: unknown) => repositories.get(entity)),
    transaction: jest.fn(),
  };
  const service = new SupervivenciasService(
    { ...curso, manager } as unknown as Repository<Supervivencia>,
    {} as never,
    asistencias as never,
    fotos as never,
    {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    curso.query.getOne.mockResolvedValue({ id: 'curso' });
    encuentros.find.mockResolvedValue([]);
    encuentros.exists.mockResolvedValue(true);
    asistencias.findOne.mockResolvedValue(null);
    asistencias.query.getRawMany.mockResolvedValue([]);
    fotos.query.getRawMany.mockResolvedValue([]);
    manager.transaction.mockImplementation(
      (callback: (em: EntityManager) => Promise<unknown>) =>
        callback(manager as unknown as EntityManager),
    );
  });

  it('configura varios días del mes sin reemplazar otros meses ni duplicar encuentros', async () => {
    encuentros.find.mockResolvedValue([{ id: 'previo', fecha: '2026-10-07' }]);
    const result = await service.configurarEncuentros('curso', {
      mes: '2026-10',
      fechas: ['2026-10-21', '2026-10-07', '2026-10-28'],
    });
    expect(result.fechas).toEqual(['2026-10-07', '2026-10-21', '2026-10-28']);
    expect(encuentros.delete).not.toHaveBeenCalled();
    expect(encuentros.insert).toHaveBeenCalledWith([
      { supervivencia: { id: 'curso' }, fecha: '2026-10-21' },
      { supervivencia: { id: 'curso' }, fecha: '2026-10-28' },
    ]);
    expect(encuentros.find).toHaveBeenCalledWith({
      where: {
        supervivencia: { id: 'curso' },
        fecha: Between('2026-10-01', '2026-10-31'),
      },
    });
    expect(curso.query.setLock).toHaveBeenCalledWith('pessimistic_write');
  });

  it('permite dejar un mes sin encuentros si aún no hay registros', async () => {
    encuentros.find.mockResolvedValue([{ id: 'quitar', fecha: '2026-10-07' }]);
    await expect(
      service.configurarEncuentros('curso', { mes: '2026-10', fechas: [] }),
    ).resolves.toEqual({ fechas: [], fechasBloqueadas: [] });
    expect(encuentros.delete).toHaveBeenCalledWith(['quitar']);
    expect(encuentros.insert).not.toHaveBeenCalled();
  });

  it.each(['asistencia', 'foto'])(
    'impide quitar una fecha con %s',
    async (tipo) => {
      const repo = tipo === 'asistencia' ? asistencias : fotos;
      repo.query.getRawMany.mockResolvedValue([{ fecha: '2026-10-07' }]);
      await expect(
        service.configurarEncuentros('curso', { mes: '2026-10', fechas: [] }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(encuentros.delete).not.toHaveBeenCalled();
      expect(encuentros.insert).not.toHaveBeenCalled();
    },
  );

  it.each([
    { mes: '2026-13', fechas: [] },
    { mes: '2026-10', fechas: ['2026-11-01'] },
    { mes: '2026-02', fechas: ['2026-02-30'] },
    { mes: '2026-10', fechas: ['2026-10-07', '2026-10-07'] },
    { mes: '2026-10', fechas: ['2026-10-07T00:00:00Z'] },
  ])('rechaza fechas inválidas, repetidas o de otro mes: %j', async (dto) => {
    await expect(
      service.configurarEncuentros('curso', dto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.transaction).not.toHaveBeenCalled();
  });

  it('rechaza cursos inexistentes', async () => {
    curso.query.getOne.mockResolvedValue(null);
    await expect(
      service.configurarEncuentros('otro', { mes: '2026-10', fechas: [] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('bloquea asistencia y fotos fuera del calendario aunque se llame directamente a la API', async () => {
    encuentros.exists.mockResolvedValue(false);
    await expect(
      service.registrarAsistencia('curso', {
        fecha: '2026-10-08',
        asistencias: [{ beneficiario_id: 'inscrito', presente: true }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.subirFotoAsistencia(
        'curso',
        '2026-10-08',
        'data:image/png;base64,AA==',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(asistencias.save).not.toHaveBeenCalled();
    expect(fotos.save).not.toHaveBeenCalled();
  });

  it('guarda asistencia en el encuentro programado del curso correcto', async () => {
    await service.registrarAsistencia('curso', {
      fecha: '2026-10-07',
      asistencias: [{ beneficiario_id: 'inscrito', presente: true }],
    });
    expect(encuentros.exists).toHaveBeenCalledWith({
      where: { supervivencia: { id: 'curso' }, fecha: '2026-10-07' },
    });
    expect(asistencias.save).toHaveBeenCalledWith(
      expect.objectContaining({
        presente: true,
        supervivencia: { id: 'curso' },
      }),
    );
  });

  it('valida el DTO de entrada sin permitir fechas inexistentes ni campos faltantes', async () => {
    expect(
      await validate(
        Object.assign(new ConfigurarEncuentrosDto(), {
          mes: '2026-10',
          fechas: ['2026-10-07', '2026-10-21'],
        }),
      ),
    ).toHaveLength(0);
    expect(
      await validate(
        Object.assign(new ConfigurarEncuentrosDto(), {
          mes: '2026-02',
          fechas: ['2026-02-30'],
        }),
      ),
    ).not.toHaveLength(0);
    expect(await validate(new ConfigurarEncuentrosDto())).not.toHaveLength(0);
  });
});
