import { ForbiddenException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AyudasService } from './ayudas.service';
import { ConfiguracionAyudas } from './configuracion-ayudas.entity';
import { CreateAyudaDto } from './dto/create-ayuda.dto';
import { UpdateDisponibilidadAyudasDto } from './dto/update-disponibilidad-ayudas.dto';

describe('Disponibilidad de ayudas', () => {
  let configuracion: ConfiguracionAyudas | null;
  const ayudas = {
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
  };
  const configuraciones = {
    findOne: jest.fn(() => Promise.resolve(configuracion)),
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
  };
  const service = new AyudasService(
    ayudas as never,
    {} as never,
    configuraciones as never,
    {} as never,
    {} as never,
  );
  const solicitud = { nombre_beneficiario: 'Ana' } as CreateAyudaDto;

  beforeEach(() => {
    jest.clearAllMocks();
    configuracion = null;
  });

  it('acepta solicitudes cuando no hay configuración guardada', async () => {
    await expect(service.getDisponibilidad()).resolves.toMatchObject({
      habilitada: true,
      motivo: null,
    });
    await service.create(solicitud);
    expect(ayudas.save).toHaveBeenCalled();
  });

  it('rechaza solicitudes con el motivo cuando están cerradas', async () => {
    configuracion = {
      id: 1,
      habilitada: false,
      motivo: 'Cierre por inventario',
    } as ConfiguracionAyudas;

    await expect(service.create(solicitud)).rejects.toThrow(
      new ForbiddenException('Cierre por inventario'),
    );
    expect(ayudas.save).not.toHaveBeenCalled();
  });

  it('guarda el motivo al cerrar y lo limpia al reabrir', async () => {
    const cerrada = await service.updateDisponibilidad(
      { habilitada: false, motivo: '  Sin fondos este mes  ' },
      'Admin',
    );
    expect(cerrada).toMatchObject({
      habilitada: false,
      motivo: 'Sin fondos este mes',
      actualizado_por: 'Admin',
    });

    configuracion = cerrada;
    await expect(
      service.updateDisponibilidad({ habilitada: true }, 'Admin'),
    ).resolves.toMatchObject({ habilitada: true, motivo: null });
  });

  it('exige motivo solo al deshabilitar', async () => {
    const sinMotivo = plainToInstance(UpdateDisponibilidadAyudasDto, {
      habilitada: false,
    });
    const abrir = plainToInstance(UpdateDisponibilidadAyudasDto, {
      habilitada: true,
    });

    expect(await validate(sinMotivo)).not.toHaveLength(0);
    expect(await validate(abrir)).toHaveLength(0);
  });
});

describe('Solicitudes de ayuda por beneficiario', () => {
  it('busca por código sin espacios ni mayúsculas y ordena por fecha', async () => {
    const qb = {
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(() => Promise.resolve([])),
    };
    const ayudas = { createQueryBuilder: jest.fn(() => qb) };
    const service = new AyudasService(
      ayudas as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await service.findByCodigoBeneficiario('do-123');

    expect(qb.where).toHaveBeenCalledWith(
      'UPPER(TRIM(a.codigo_beneficiario)) = UPPER(TRIM(:codigo))',
      { codigo: 'do-123' },
    );
    expect(qb.orderBy).toHaveBeenCalledWith('a.creado_en', 'DESC');
  });
});
