import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BonoRegalo } from './bono-regalo.entity';
import {
  CreateBonosRegaloLoteDto,
  MarcarEntregadoDto,
} from './dto/create-bono-regalo.dto';
import { FilterBonoRegaloDto } from './dto/filter-bono-regalo.dto';

@Injectable()
export class BonosService {
  constructor(
    @InjectRepository(BonoRegalo)
    private readonly bonoRepo: Repository<BonoRegalo>,
  ) {}

  private parseFecha(fecha: string): Date {
    if (fecha.includes('/')) {
      const [d, m, y] = fecha.split('/');
      return new Date(`${y}-${m}-${d}T12:00:00`);
    }
    return new Date(fecha);
  }

  async crearLote(
    dto: CreateBonosRegaloLoteDto,
    registradoPorId?: string,
  ): Promise<BonoRegalo[]> {
    const bonos = dto.bonos.map((b) =>
      this.bonoRepo.create({
        ...b,
        expira: b.expira ? this.parseFecha(b.expira) : undefined,
        beneficiario: b.beneficiario_id
          ? ({ id: b.beneficiario_id } as any)
          : undefined,
        registrado_por: registradoPorId
          ? ({ id: registradoPorId } as any)
          : undefined,
      }),
    );
    return await this.bonoRepo.save(bonos);
  }

  async findAll(filters?: FilterBonoRegaloDto): Promise<BonoRegalo[]> {
    const where: any = {};

    if (filters?.mes) {
      where.mes = filters.mes;
    }

    if (filters?.entregado !== undefined && filters.entregado !== '') {
      where.entregado = filters.entregado === 'true';
    }

    if (filters?.buscar) {
      where.beneficiario_nombre = Like(`%${filters.buscar}%`);
    }

    return await this.bonoRepo.find({
      where,
      relations: ['beneficiario', 'registrado_por', 'entregado_por'],
      order: { creado_en: 'DESC' },
    });
  }

  async findMeses(): Promise<string[]> {
    const rows = await this.bonoRepo
      .createQueryBuilder('b')
      .select('DISTINCT b.mes', 'mes')
      .where('b.mes IS NOT NULL')
      .andWhere("b.mes <> ''")
      .orderBy('b.mes', 'ASC')
      .getRawMany<{ mes: string }>();
    return rows.map((r) => r.mes).filter((m) => m && m.trim() !== '');
  }

  async findOne(id: string): Promise<BonoRegalo> {
    const bono = await this.bonoRepo.findOne({
      where: { id },
      relations: ['beneficiario', 'registrado_por', 'entregado_por'],
    });
    if (!bono) {
      throw new NotFoundException(`Bono con ID ${id} no encontrado`);
    }
    return bono;
  }

  async marcarEntregado(
    id: string,
    dto: MarcarEntregadoDto,
    entregadoPorId?: string,
  ): Promise<BonoRegalo> {
    const bono = await this.findOne(id);
    bono.entregado = true;
    bono.foto_entrega = dto.foto_entrega || bono.foto_entrega;
    bono.entregado_por = entregadoPorId
      ? ({ id: entregadoPorId } as any)
      : bono.entregado_por;
    return await this.bonoRepo.save(bono);
  }

  async remove(id: string): Promise<void> {
    const bono = await this.findOne(id);
    await this.bonoRepo.remove(bono);
  }

  async estadisticas(mes?: string) {
    const where: any = {};
    if (mes) where.mes = mes;

    const total = await this.bonoRepo.count({ where });
    const entregados = await this.bonoRepo.count({
      where: { ...where, entregado: true },
    });
    const pendientes = total - entregados;

    const montoTotal = await this.bonoRepo
      .createQueryBuilder('b')
      .select('SUM(b.monto)', 'total')
      .where(mes ? 'b.mes = :mes' : '1=1', { mes })
      .getRawOne();

    return {
      total,
      entregados,
      pendientes,
      monto_total: parseFloat(montoTotal?.total || '0'),
    };
  }
}
