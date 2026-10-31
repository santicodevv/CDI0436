import { NotFoundException } from '@nestjs/common';
import { DesembolsosService } from './desembolsos.service';
import { Desembolso } from './desembolso.entity';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { UpdateDesembolsoDto } from './dto/update-desembolso.dto';

describe('DesembolsosService', () => {
  const beneficiarios: Record<string, Partial<Beneficiario>> = {
    'CDI-001': {
      id: 'b1',
      codigo: 'CDI-001',
      nombre: 'Ana',
      apellido: 'Pérez',
    },
    'CDI-002': {
      id: 'b2',
      codigo: 'CDI-002',
      nombre: 'Luis',
      apellido: null as never,
    },
  };
  let existente: Desembolso | null;
  const desembolsoRepo = {
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => Promise.resolve(data)),
    findOne: jest.fn(() => Promise.resolve(existente)),
  };
  const beneficiarioRepo = {
    findOne: jest.fn(({ where }: { where: { codigo: string } }) =>
      Promise.resolve(beneficiarios[where.codigo] ?? null),
    ),
  };
  const service = new DesembolsosService(
    desembolsoRepo as never,
    beneficiarioRepo as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    existente = {
      id: 'd1',
      fecha: '2026-10-01',
      detalle: 'Compra de útiles',
      codigo_beneficiario: 'CDI-001',
      nombre_beneficiario: 'Ana Pérez',
      referencia: 'TRX-1',
      cuenta: '1001',
      monto: 1500,
      beneficiario: { id: 'b1' } as Beneficiario,
    } as Desembolso;
  });

  it('devuelve el nombre completo al buscar por código', async () => {
    await expect(service.buscarBeneficiario(' CDI-001 ')).resolves.toEqual({
      id: 'b1',
      codigo: 'CDI-001',
      nombre: 'Ana Pérez',
    });
    await expect(service.buscarBeneficiario('CDI-002')).resolves.toMatchObject({
      nombre: 'Luis',
    });
  });

  it('rechaza códigos que no existen', async () => {
    await expect(service.buscarBeneficiario('X')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('al registrar toma el nombre del beneficiario y lo enlaza', async () => {
    const result = await service.create(
      {
        fecha: '2026-10-30',
        detalle: ' Ayuda médica ',
        codigo_beneficiario: 'CDI-001',
        referencia: '',
        cuenta: '2002',
        monto: 3000,
      },
      'u1',
    );
    expect(result).toMatchObject({
      detalle: 'Ayuda médica',
      codigo_beneficiario: 'CDI-001',
      nombre_beneficiario: 'Ana Pérez',
      referencia: null,
      cuenta: '2002',
      monto: 3000,
      beneficiario: { id: 'b1' },
      registrado_por: { id: 'u1' },
    });
  });

  it('al cambiar el código vuelve a enlazar al nuevo beneficiario', async () => {
    const result = await service.update('d1', {
      codigo_beneficiario: 'CDI-002',
      monto: 2000,
    });
    expect(result).toMatchObject({
      codigo_beneficiario: 'CDI-002',
      nombre_beneficiario: 'Luis',
      beneficiario: { id: 'b2' },
      monto: 2000,
      referencia: 'TRX-1',
    });
  });

  it('ignora campos que no son editables', async () => {
    const result = await service.update('d1', {
      nombre_beneficiario: 'Otro',
      registrado_por: { id: 'hack' },
    } as unknown as UpdateDesembolsoDto);
    expect(result.nombre_beneficiario).toBe('Ana Pérez');
    expect(result.registrado_por).toBeUndefined();
  });
});
