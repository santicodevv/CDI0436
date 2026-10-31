import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Desembolso } from './desembolso.entity';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { CreateDesembolsoDto } from './dto/create-desembolso.dto';
import { UpdateDesembolsoDto } from './dto/update-desembolso.dto';
import { FilterDesembolsoDto } from './dto/filter-desembolso.dto';

export interface BeneficiarioResumen {
  id: string;
  codigo: string;
  nombre: string;
}

@Injectable()
export class DesembolsosService {
  constructor(
    @InjectRepository(Desembolso)
    private readonly desembolsoRepo: Repository<Desembolso>,
    @InjectRepository(Beneficiario)
    private readonly beneficiarioRepo: Repository<Beneficiario>,
  ) {}

  private nombreCompleto(b: Beneficiario): string {
    return `${b.nombre} ${b.apellido || ''}`.trim();
  }

  async buscarBeneficiario(codigo: string): Promise<BeneficiarioResumen> {
    const beneficiario = await this.beneficiarioRepo.findOne({
      where: { codigo: codigo.trim() },
    });
    if (!beneficiario) {
      throw new NotFoundException(
        `No existe un beneficiario con el código ${codigo}`,
      );
    }
    return {
      id: beneficiario.id,
      codigo: beneficiario.codigo,
      nombre: this.nombreCompleto(beneficiario),
    };
  }

  private opcional(valor?: string): string | null {
    return valor?.trim() || null;
  }

  async create(
    dto: CreateDesembolsoDto,
    registradoPorId?: string,
  ): Promise<Desembolso> {
    const beneficiario = await this.buscarBeneficiario(dto.codigo_beneficiario);
    const desembolso = this.desembolsoRepo.create({
      fecha: dto.fecha,
      detalle: dto.detalle.trim(),
      codigo_beneficiario: beneficiario.codigo,
      nombre_beneficiario: beneficiario.nombre,
      referencia: this.opcional(dto.referencia),
      cuenta: this.opcional(dto.cuenta),
      monto: dto.monto,
      beneficiario: { id: beneficiario.id } as Beneficiario,
      registrado_por: registradoPorId
        ? ({ id: registradoPorId } as Desembolso['registrado_por'])
        : null,
    });
    return await this.desembolsoRepo.save(desembolso);
  }

  async findAll(filters?: FilterDesembolsoDto): Promise<Desembolso[]> {
    const query = this.desembolsoRepo
      .createQueryBuilder('d')
      // Solo id y nombre; no hace falta exponer correo ni rol
      .leftJoin('d.registrado_por', 'registrado_por')
      .addSelect(['registrado_por.id', 'registrado_por.nombre'])
      .orderBy('d.fecha', 'DESC')
      .addOrderBy('d.creado_en', 'DESC');

    if (filters?.buscar) {
      query.andWhere(
        '(d.nombre_beneficiario ILIKE :buscar OR d.codigo_beneficiario ILIKE :buscar OR d.referencia ILIKE :buscar OR d.detalle ILIKE :buscar)',
        { buscar: `%${filters.buscar}%` },
      );
    }
    if (filters?.desde) {
      query.andWhere('d.fecha >= :desde', { desde: filters.desde });
    }
    if (filters?.hasta) {
      query.andWhere('d.fecha <= :hasta', { hasta: filters.hasta });
    }

    return await query.getMany();
  }

  async findByBeneficiario(beneficiarioId: string): Promise<Desembolso[]> {
    return await this.desembolsoRepo.find({
      where: { beneficiario: { id: beneficiarioId } },
      order: { fecha: 'DESC', creado_en: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Desembolso> {
    const desembolso = await this.desembolsoRepo.findOne({
      where: { id },
      relations: ['beneficiario'],
    });
    if (!desembolso) {
      throw new NotFoundException(`Registro con ID ${id} no encontrado`);
    }
    return desembolso;
  }

  async update(id: string, dto: UpdateDesembolsoDto): Promise<Desembolso> {
    const desembolso = await this.findOne(id);

    if (
      dto.codigo_beneficiario !== undefined &&
      dto.codigo_beneficiario.trim() !== desembolso.codigo_beneficiario
    ) {
      const beneficiario = await this.buscarBeneficiario(
        dto.codigo_beneficiario,
      );
      desembolso.codigo_beneficiario = beneficiario.codigo;
      desembolso.nombre_beneficiario = beneficiario.nombre;
      desembolso.beneficiario = { id: beneficiario.id } as Beneficiario;
    }
    // El ValidationPipe global no aplica whitelist: copiar solo campos editables.
    if (dto.fecha !== undefined) desembolso.fecha = dto.fecha;
    if (dto.detalle !== undefined) desembolso.detalle = dto.detalle.trim();
    if (dto.referencia !== undefined) {
      desembolso.referencia = this.opcional(dto.referencia);
    }
    if (dto.cuenta !== undefined) desembolso.cuenta = this.opcional(dto.cuenta);
    if (dto.monto !== undefined) desembolso.monto = dto.monto;

    return await this.desembolsoRepo.save(desembolso);
  }

  async remove(id: string): Promise<void> {
    const desembolso = await this.findOne(id);
    await this.desembolsoRepo.remove(desembolso);
  }
}
