import { NotFoundException } from '@nestjs/common';
import { BonosService } from './bonos.service';
import { BonoRegalo } from './bono-regalo.entity';
import { UpdateBonoRegaloDto } from './dto/update-bono-regalo.dto';

describe('BonosService.update', () => {
  let bono: BonoRegalo | null;
  const repo = {
    findOne: jest.fn(() => Promise.resolve(bono)),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
  };
  const service = new BonosService(repo as never);

  beforeEach(() => {
    jest.clearAllMocks();
    bono = {
      id: 'b1',
      codigo: 'A-001',
      beneficiario_nombre: 'Jaun Perez',
      padre_nombre: 'Pedro',
      cedula: '001-0000000-1',
      monto: 500,
      mes: 'Octubre',
      entregado: false,
    } as BonoRegalo;
  });

  it('corrige los datos del bono y convierte la fecha DD/MM/YYYY', async () => {
    const result = await service.update('b1', {
      beneficiario_nombre: ' Juan Pérez ',
      cedula: '001-1234567-8',
      monto: 750,
      expira: '15/12/2026',
    });

    expect(result).toMatchObject({
      beneficiario_nombre: 'Juan Pérez',
      cedula: '001-1234567-8',
      monto: 750,
      codigo: 'A-001',
    });
    expect(result.expira.toISOString().slice(0, 10)).toBe('2026-12-15');
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('guarda null cuando se vacían padre o cédula', async () => {
    const result = await service.update('b1', {
      padre_nombre: '',
      cedula: ' ',
    });
    expect(result.padre_nombre).toBeNull();
    expect(result.cedula).toBeNull();
  });

  it('ignora campos que no son editables', async () => {
    const result = await service.update('b1', {
      entregado: true,
      foto_entrega: '/x.png',
    } as unknown as UpdateBonoRegaloDto);
    expect(result.entregado).toBe(false);
    expect(result.foto_entrega).toBeUndefined();
  });

  it('lanza NotFound si el bono no existe', async () => {
    bono = null;
    await expect(service.update('nope', { mes: 'Noviembre' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
