import { ConflictException, NotFoundException } from '@nestjs/common';
import { IsNull, type Repository } from 'typeorm';
import { ValidationPipe } from '../../common/pipes/validation.pipe';
import { Clase } from '../clases/clase.entity';
import { Beneficiario } from './beneficiario.entity';
import { BeneficiarioExpediente } from './beneficiario-expediente.entity';
import {
  BeneficiarioMudanza,
  ResultadoMudanza,
} from './beneficiario-mudanza.entity';
import { BeneficiariosService } from './beneficiarios.service';
import {
  FinalizarMudanzaDto,
  RegistrarMudanzaDto,
} from './dto/beneficiario-mudanza.dto';

describe('Mudanzas de beneficiarios', () => {
  const usuario = { id: 'usuario-1', nombre: 'Josefina' };
  const contacto = {
    direccion: 'Calle 1',
    telefono: '8095551234',
    cuidador: 'Ana',
  };
  const pipe = new ValidationPipe();
  const relacion = {
    of: jest.fn().mockReturnThis(),
    loadMany: jest.fn(),
    remove: jest.fn(),
  };
  const builder = { relation: jest.fn().mockReturnValue(relacion) };
  const manager = {
    findOne: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(
      (_entity: typeof BeneficiarioMudanza, data: object) => data,
    ),
    findOneBy: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(builder),
    update: jest.fn(),
    delete: jest.fn(),
    save: jest.fn((data: object) => Promise.resolve(data)),
  };
  const service = new BeneficiariosService(
    {
      manager: {
        transaction: (run: (transaction: typeof manager) => unknown) =>
          run(manager),
      },
    } as unknown as Repository<Beneficiario>,
    {} as Repository<Clase>,
    {} as Repository<BeneficiarioExpediente>,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    manager.findOne.mockResolvedValue({ id: 'beneficiario-1', activo: true });
    manager.exists.mockResolvedValue(false);
    manager.findOneBy.mockResolvedValue({ resultado: null });
    relacion.loadMany.mockResolvedValue([{ id: 'actividad-1' }]);
    relacion.remove.mockResolvedValue(undefined);
  });

  it('registra el contacto y su autor sin desactivar al participante', async () => {
    await expect(
      service.registrarMudanza('beneficiario-1', contacto, usuario),
    ).resolves.toMatchObject({
      ...contacto,
      beneficiario_id: 'beneficiario-1',
      registrado_por_id: usuario.id,
    });
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('rechaza una segunda mudanza pendiente', async () => {
    manager.exists.mockResolvedValue(true);
    await expect(
      service.registrarMudanza('beneficiario-1', contacto, usuario),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it.each([
    { resultado: ResultadoMudanza.SALIDA },
    {
      resultado: ResultadoMudanza.TRASLADO,
      centro_receptor: 'CDI receptor',
      recepcion_confirmada: true,
    },
  ])('finaliza $resultado y retira las inscripciones', async (cierre) => {
    await expect(
      service.finalizarMudanza('beneficiario-1', 'mudanza-1', cierre, usuario),
    ).resolves.toMatchObject({
      resultado: cierre.resultado,
      centro_receptor: cierre.centro_receptor ?? null,
      finalizado_por: usuario.nombre,
    });
    expect(manager.findOneBy).toHaveBeenCalledWith(BeneficiarioMudanza, {
      id: 'mudanza-1',
      beneficiario_id: 'beneficiario-1',
    });
    expect(builder.relation.mock.calls).toEqual([
      [Beneficiario, 'clases'],
      [Beneficiario, 'clubes'],
      [Beneficiario, 'supervivencias'],
    ]);
    expect(relacion.remove).toHaveBeenCalledTimes(3);
    expect(manager.update).toHaveBeenCalledWith(
      Beneficiario,
      'beneficiario-1',
      { activo: false },
    );
  });

  it('rechaza cerrar una mudanza ajena o ya cerrada', async () => {
    const cierre = { resultado: ResultadoMudanza.SALIDA };
    manager.findOneBy.mockResolvedValueOnce(null).mockResolvedValueOnce(cierre);
    await expect(
      service.finalizarMudanza('beneficiario-1', 'mudanza-1', cierre, usuario),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.finalizarMudanza('beneficiario-1', 'mudanza-1', cierre, usuario),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(manager.update).not.toHaveBeenCalled();
  });

  describe('eliminar mudanza pendiente', () => {
    it('bloquea al beneficiario y borra solo si sigue pendiente', async () => {
      manager.findOneBy.mockResolvedValue({
        id: 'mudanza-1',
        beneficiario_id: 'beneficiario-1',
        resultado: null,
      });
      manager.delete.mockResolvedValue({ affected: 1 });

      await expect(
        service.eliminarMudanzaPendiente('mudanza-1'),
      ).resolves.toBeUndefined();
      expect(manager.findOne).toHaveBeenCalledWith(Beneficiario, {
        where: { id: 'beneficiario-1' },
        lock: { mode: 'pessimistic_write' },
      });
      expect(manager.delete).toHaveBeenCalledWith(BeneficiarioMudanza, {
        id: 'mudanza-1',
        resultado: IsNull(),
      });
    });

    it('responde 404 si no existe', async () => {
      manager.findOneBy.mockResolvedValue(null);
      await expect(
        service.eliminarMudanzaPendiente('mudanza-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(manager.delete).not.toHaveBeenCalled();
    });

    it('rechaza borrar una mudanza ya finalizada', async () => {
      manager.findOneBy.mockResolvedValue({
        id: 'mudanza-1',
        beneficiario_id: 'beneficiario-1',
        resultado: ResultadoMudanza.TRASLADO,
      });
      manager.delete.mockResolvedValue({ affected: 0 });
      await expect(
        service.eliminarMudanzaPendiente('mudanza-1'),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  it('exige dirección y, para traslados, centro y confirmación de recepción', async () => {
    await expect(
      pipe.transform(
        { ...contacto, direccion: '  ' },
        {
          type: 'body',
          metatype: RegistrarMudanzaDto,
        },
      ),
    ).rejects.toThrow();
    const metadata = { type: 'body' as const, metatype: FinalizarMudanzaDto };
    await expect(
      pipe.transform(
        { resultado: 'traslado', recepcion_confirmada: true },
        metadata,
      ),
    ).rejects.toThrow();
    await expect(
      pipe.transform(
        { resultado: 'traslado', centro_receptor: 'CDI receptor' },
        metadata,
      ),
    ).rejects.toThrow();
    await expect(
      pipe.transform({ resultado: 'salida' }, metadata),
    ).resolves.toEqual({ resultado: 'salida' });
  });
});
