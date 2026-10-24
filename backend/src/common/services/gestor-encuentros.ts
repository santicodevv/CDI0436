import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Between, EntityManager, EntityTarget } from 'typeorm';
import { ConfigurarEncuentrosDto } from '../dto/configurar-encuentros.dto';
interface Encuentro {
  id: string;
  fecha: string;
  club?: { id: string };
  supervivencia?: { id: string };
}
interface ConfiguracionEncuentros {
  curso: EntityTarget<{ id: string }>;
  encuentro: EntityTarget<Encuentro>;
  asistencia: EntityTarget<{ id: string }>;
  foto: EntityTarget<{ id: string }>;
  relacion: 'club' | 'supervivencia';
}
export class GestorEncuentros {
  constructor(
    private readonly manager: EntityManager,
    private readonly config: ConfiguracionEncuentros,
  ) {}
  async conCursoBloqueado<T>(
    id: string,
    operacion: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.manager.transaction(async (manager) => {
      const curso = await manager
        .getRepository(this.config.curso)
        .createQueryBuilder('curso')
        .where('curso.id = :id', { id })
        .setLock('pessimistic_write')
        .getOne();
      if (!curso) {
        throw new NotFoundException(`Curso o club con ID ${id} no encontrado`);
      }
      return operacion(manager);
    });
  }

  private rangoMes(mes: string): { inicio: string; fin: string } {
    if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(mes)) {
      throw new BadRequestException('El mes debe tener el formato YYYY-MM');
    }
    const [anio, numeroMes] = mes.split('-').map(Number);
    const ultimoDia = new Date(Date.UTC(anio, numeroMes, 0)).getUTCDate();
    return { inicio: `${mes}-01`, fin: `${mes}-${ultimoDia}` };
  }

  private async fechasConRegistros(
    manager: EntityManager,
    id: string,
    inicio: string,
    fin: string,
  ): Promise<string[]> {
    const asistencias = await manager
      .getRepository(this.config.asistencia)
      .createQueryBuilder('registro')
      .select('DISTINCT CAST(registro.fecha AS text)', 'fecha')
      .where(`registro.${this.config.relacion}_id = :id`, { id })
      .andWhere('registro.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .getRawMany<{ fecha: string }>();
    const fotos = await manager
      .getRepository(this.config.foto)
      .createQueryBuilder('registro')
      .select('DISTINCT CAST(registro.fecha AS text)', 'fecha')
      .where(`registro.${this.config.relacion}_id = :id`, { id })
      .andWhere('registro.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .getRawMany<{ fecha: string }>();
    return [...new Set([...asistencias, ...fotos].map((r) => r.fecha))].sort();
  }

  async getEncuentros(id: string, mes: string) {
    const { inicio, fin } = this.rangoMes(mes);
    if (
      !(await this.manager
        .getRepository(this.config.curso)
        .exists({ where: { id } }))
    )
      throw new NotFoundException('Curso o club no encontrado');
    const manager = this.manager;
    const encuentros = await manager.getRepository(this.config.encuentro).find({
      where: { [this.config.relacion]: { id }, fecha: Between(inicio, fin) },
      order: { fecha: 'ASC' },
    });
    const fechasBloqueadas = await this.fechasConRegistros(
      manager,
      id,
      inicio,
      fin,
    );
    return { fechas: encuentros.map((e) => e.fecha), fechasBloqueadas };
  }

  private esFechaValida(fecha: string): boolean {
    const parsed = new Date(`${fecha}T00:00:00Z`);
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === fecha
    );
  }

  async configurarEncuentros(id: string, dto: ConfigurarEncuentrosDto) {
    const { inicio, fin } = this.rangoMes(dto.mes);
    if (
      dto.fechas.some((fecha) => {
        return !this.esFechaValida(fecha) || fecha < inicio || fecha > fin;
      }) ||
      new Set(dto.fechas).size !== dto.fechas.length
    ) {
      throw new BadRequestException(
        'Selecciona fechas válidas y sin duplicados dentro del mes indicado',
      );
    }
    return this.conCursoBloqueado(id, async (manager) => {
      const fechasBloqueadas = await this.fechasConRegistros(
        manager,
        id,
        inicio,
        fin,
      );
      if (fechasBloqueadas.some((fecha) => !dto.fechas.includes(fecha))) {
        throw new ConflictException(
          'No se pueden quitar encuentros que ya tienen asistencia o fotos',
        );
      }
      const repository = manager.getRepository(this.config.encuentro);
      const existentes = await repository.find({
        where: { [this.config.relacion]: { id }, fecha: Between(inicio, fin) },
      });
      const quitar = existentes.filter((e) => !dto.fechas.includes(e.fecha));
      if (quitar.length) await repository.delete(quitar.map((e) => e.id));
      const agregar = dto.fechas.filter(
        (fecha) => !existentes.some((e) => e.fecha === fecha),
      );
      if (agregar.length) {
        await repository.insert(
          agregar.map((fecha) => ({ [this.config.relacion]: { id }, fecha })),
        );
      }
      return { fechas: [...dto.fechas].sort(), fechasBloqueadas };
    });
  }

  async validarEncuentro(manager: EntityManager, id: string, fecha: string) {
    if (
      !this.esFechaValida(fecha) ||
      !(await manager.getRepository(this.config.encuentro).exists({
        where: { [this.config.relacion]: { id }, fecha },
      }))
    ) {
      throw new BadRequestException(
        'Solo puedes registrar asistencia o fotos en un encuentro configurado',
      );
    }
  }
}
