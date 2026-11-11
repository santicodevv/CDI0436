import type { Repository } from 'typeorm';
import { ValidationPipe } from '../../common/pipes/validation.pipe';
import { Clase } from '../clases/clase.entity';
import { Beneficiario } from './beneficiario.entity';
import { BeneficiarioExpediente } from './beneficiario-expediente.entity';
import { BeneficiariosService } from './beneficiarios.service';
import { FiltrarMudanzasDto } from './dto/beneficiario-mudanza.dto';

type Llamada = [string, unknown[]];

// Query builder falso: registra las llamadas de cada clon por separado.
function crearBuilder(registro: Llamada[][]) {
  const llamadas: Llamada[] = [];
  registro.push(llamadas);
  const builder: Record<string, jest.Mock> = {};
  for (const metodo of [
    'innerJoin',
    'andWhere',
    'select',
    'addSelect',
    'orderBy',
    'addOrderBy',
    'offset',
    'limit',
  ]) {
    builder[metodo] = jest.fn((...args: unknown[]) => {
      llamadas.push([metodo, args]);
      return builder;
    });
  }
  builder.getRawOne = jest.fn().mockResolvedValue({
    pendientes: '2',
    traslados: '5',
    salidas: '1',
  });
  builder.getManyAndCount = jest
    .fn()
    .mockResolvedValue([[{ id: 'mudanza-1' }], 45]);
  return builder;
}

describe('Listado general de mudanzas', () => {
  let registro: Llamada[][];
  let service: BeneficiariosService;

  beforeEach(() => {
    registro = [];
    service = new BeneficiariosService(
      {
        manager: { createQueryBuilder: jest.fn(() => crearBuilder(registro)) },
      } as unknown as Repository<Beneficiario>,
      {} as Repository<Clase>,
      {} as Repository<BeneficiarioExpediente>,
    );
  });

  const listado = () => registro[registro.length - 1];
  const wheres = (llamadas: Llamada[]) =>
    llamadas.filter(([m]) => m === 'andWhere').map(([, a]) => a);

  it('pagina, resume y devuelve el total', async () => {
    const res = await service.listarMudanzas({ pagina: '3', limite: '20' });

    expect(res).toEqual({
      data: [{ id: 'mudanza-1' }],
      total: 45,
      pagina: 3,
      limite: 20,
      totalPaginas: 3,
      resumen: { pendientes: 2, traslados: 5, salidas: 1 },
    });
    expect(listado()).toContainEqual(['offset', [40]]);
    expect(listado()).toContainEqual(['limit', [20]]);
  });

  it('usa valores por defecto y limita el tamaño de página', async () => {
    const res = await service.listarMudanzas({ pagina: '0', limite: '500' });
    expect(res.pagina).toBe(1);
    expect(res.limite).toBe(100);
  });

  it('filtra pendientes solo en el listado, no en el resumen', async () => {
    await service.listarMudanzas({ estado: 'pendiente', buscar: ' Ana ' });

    const [resumen] = registro;
    expect(registro).toHaveLength(2);
    expect(wheres(resumen)).toHaveLength(1);
    expect(wheres(resumen)[0][1]).toEqual({ buscar: '%Ana%' });
    expect(wheres(listado())).toContainEqual(['m.resultado IS NULL']);
  });

  it('filtra por resultado y rango de fechas', async () => {
    await service.listarMudanzas({
      estado: 'traslado',
      desde: '2026-11-01',
      hasta: '2026-11-30',
    });

    expect(wheres(listado())).toEqual(
      expect.arrayContaining([
        [
          expect.stringContaining('>= :desde'),
          expect.objectContaining({ desde: '2026-11-01' }),
        ],
        [
          expect.stringContaining('<= :hasta'),
          expect.objectContaining({ hasta: '2026-11-30' }),
        ],
        ['m.resultado = :estado', { estado: 'traslado' }],
      ]),
    );
  });

  describe('validación de filtros', () => {
    const pipe = new ValidationPipe();
    const validar = (value: object) =>
      pipe.transform(value, { type: 'query', metatype: FiltrarMudanzasDto });

    it('acepta filtros válidos', async () => {
      await expect(
        validar({ estado: 'salida', pagina: '2', desde: '2026-01-01' }),
      ).resolves.toBeDefined();
    });

    it.each([
      { estado: 'otro' },
      { pagina: '-1' },
      { limite: 'abc' },
      { desde: 'ayer' },
    ])('rechaza %p', async (value) => {
      await expect(validar(value)).rejects.toThrow();
    });
  });
});
