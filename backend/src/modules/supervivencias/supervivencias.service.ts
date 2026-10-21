import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, EntityManager } from 'typeorm';
import { Supervivencia } from './supervivencia.entity';
import { AsistenciaSupervivencia } from './asistencia-supervivencia.entity';
import { FotoAsistenciaSupervivencia } from './foto-asistencia-supervivencia.entity';
import { CreateSupervivenciaDto } from './dto/create-supervivencia.dto';
import { UpdateSupervivenciaDto } from './dto/update-supervivencia.dto';
import { FilterSupervivenciaDto } from './dto/filter-supervivencia.dto';
import { AgregarBeneficiariosSupervivenciaDto } from './dto/agregar-beneficiarios.dto';
import { RegistrarAsistenciaSupervivenciaDto } from './dto/registrar-asistencia.dto';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { Tutor } from '../tutores/tutor.entity';
import { EncuentroSupervivencia } from './encuentro-supervivencia.entity';
import { ConfigurarEncuentrosDto } from './dto/configurar-encuentros.dto';

@Injectable()
export class SupervivenciasService {
  constructor(
    @InjectRepository(Supervivencia)
    private supervivenciasRepository: Repository<Supervivencia>,
    @InjectRepository(Beneficiario)
    private beneficiariosRepository: Repository<Beneficiario>,
    @InjectRepository(AsistenciaSupervivencia)
    private asistenciasRepository: Repository<AsistenciaSupervivencia>,
    @InjectRepository(FotoAsistenciaSupervivencia)
    private fotosRepository: Repository<FotoAsistenciaSupervivencia>,
    @InjectRepository(Tutor)
    private tutoresRepository: Repository<Tutor>,
  ) {}

  async create(
    createSupervivenciaDto: CreateSupervivenciaDto,
  ): Promise<Supervivencia> {
    if (createSupervivenciaDto.codigo) {
      const codigoExiste = await this.supervivenciasRepository.findOne({
        where: { codigo: createSupervivenciaDto.codigo },
      });

      if (codigoExiste) {
        throw new ConflictException(
          `Ya existe un curso de supervivencia con el código ${createSupervivenciaDto.codigo}`,
        );
      }
    }

    const { tutor_id, ...supervivenciaData } = createSupervivenciaDto;
    const supervivencia =
      this.supervivenciasRepository.create(supervivenciaData);

    if (tutor_id) {
      const tutor = await this.tutoresRepository.findOne({
        where: { id: tutor_id },
      });
      if (!tutor) {
        throw new NotFoundException(`Tutor con ID ${tutor_id} no encontrado`);
      }
      supervivencia.tutor = tutor;
    }

    return await this.supervivenciasRepository.save(supervivencia);
  }

  async findAll(filters?: FilterSupervivenciaDto): Promise<Supervivencia[]> {
    const query = this.supervivenciasRepository
      .createQueryBuilder('supervivencia')
      .leftJoinAndSelect('supervivencia.beneficiarios', 'beneficiarios')
      .leftJoinAndSelect('supervivencia.tutor', 'tutor')
      .orderBy('supervivencia.nombre', 'ASC');

    if (filters) {
      if (filters.nombre) {
        query.andWhere('supervivencia.nombre ILIKE :nombre', {
          nombre: `%${filters.nombre}%`,
        });
      }

      if (filters.codigo) {
        query.andWhere('supervivencia.codigo ILIKE :codigo', {
          codigo: `%${filters.codigo}%`,
        });
      }

      if (filters.activo !== undefined) {
        query.andWhere('supervivencia.activo = :activo', {
          activo: filters.activo,
        });
      }
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Supervivencia> {
    const supervivencia = await this.supervivenciasRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!supervivencia) {
      throw new NotFoundException(
        `Curso de supervivencia con ID ${id} no encontrado`,
      );
    }

    return supervivencia;
  }

  async findByCodigo(codigo: string): Promise<Supervivencia> {
    const supervivencia = await this.supervivenciasRepository.findOne({
      where: { codigo },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!supervivencia) {
      throw new NotFoundException(
        `Curso de supervivencia con código ${codigo} no encontrado`,
      );
    }

    return supervivencia;
  }

  async update(
    id: string,
    updateSupervivenciaDto: UpdateSupervivenciaDto,
  ): Promise<Supervivencia> {
    const supervivencia = await this.findOne(id);

    if (
      updateSupervivenciaDto.codigo &&
      updateSupervivenciaDto.codigo !== supervivencia.codigo
    ) {
      const codigoExiste = await this.supervivenciasRepository.findOne({
        where: { codigo: updateSupervivenciaDto.codigo },
      });

      if (codigoExiste) {
        throw new ConflictException(
          `Ya existe un curso de supervivencia con el código ${updateSupervivenciaDto.codigo}`,
        );
      }
    }

    const { tutor_id, ...supervivenciaData } = updateSupervivenciaDto as any;
    Object.assign(supervivencia, supervivenciaData);

    if (tutor_id !== undefined) {
      if (tutor_id === null || tutor_id === '') {
        supervivencia.tutor = null as any;
      } else {
        const tutor = await this.tutoresRepository.findOne({
          where: { id: tutor_id },
        });
        if (!tutor) {
          throw new NotFoundException(`Tutor con ID ${tutor_id} no encontrado`);
        }
        supervivencia.tutor = tutor;
      }
    }

    return await this.supervivenciasRepository.save(supervivencia);
  }

  async remove(id: string): Promise<void> {
    const supervivencia = await this.supervivenciasRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!supervivencia) {
      throw new NotFoundException(
        `Curso de supervivencia con ID ${id} no encontrado`,
      );
    }

    // Verificar que no tenga beneficiarios
    if (supervivencia.beneficiarios && supervivencia.beneficiarios.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar el curso porque tiene ${supervivencia.beneficiarios.length} beneficiario(s) inscrito(s)`,
      );
    }

    await this.supervivenciasRepository.remove(supervivencia);
  }

  async softDelete(id: string): Promise<Supervivencia> {
    const supervivencia = await this.findOne(id);
    supervivencia.activo = false;
    return await this.supervivenciasRepository.save(supervivencia);
  }

  // Agregar beneficiarios al curso de supervivencia
  async agregarBeneficiarios(
    id: string,
    agregarBeneficiariosDto: AgregarBeneficiariosSupervivenciaDto,
  ): Promise<Supervivencia> {
    const supervivencia = await this.supervivenciasRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!supervivencia) {
      throw new NotFoundException(
        `Curso de supervivencia con ID ${id} no encontrado`,
      );
    }

    // Buscar los beneficiarios
    const beneficiarios = await this.beneficiariosRepository.find({
      where: {
        id: In(agregarBeneficiariosDto.beneficiarioIds),
        activo: true,
      },
    });

    if (
      beneficiarios.length !== agregarBeneficiariosDto.beneficiarioIds.length
    ) {
      throw new NotFoundException(
        'Uno o más beneficiarios no fueron encontrados o están inactivos',
      );
    }

    // Verificar capacidad máxima
    const beneficiariosActuales = supervivencia.beneficiarios?.length || 0;
    const nuevosBeneficiarios = beneficiarios.filter(
      (b) => !supervivencia.beneficiarios?.some((cb) => cb.id === b.id),
    );

    if (supervivencia.capacidad_maxima > 0) {
      const totalDespues = beneficiariosActuales + nuevosBeneficiarios.length;
      if (totalDespues > supervivencia.capacidad_maxima) {
        throw new BadRequestException(
          `El curso solo puede tener ${supervivencia.capacidad_maxima} beneficiarios. ` +
            `Actualmente tiene ${beneficiariosActuales} y se intentan agregar ${nuevosBeneficiarios.length}`,
        );
      }
    }

    // Agregar beneficiarios sin duplicar
    supervivencia.beneficiarios = [
      ...(supervivencia.beneficiarios || []),
      ...nuevosBeneficiarios,
    ];
    return await this.supervivenciasRepository.save(supervivencia);
  }

  // Remover un beneficiario del curso de supervivencia
  async removerBeneficiario(
    id: string,
    beneficiarioId: string,
  ): Promise<Supervivencia> {
    const supervivencia = await this.supervivenciasRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!supervivencia) {
      throw new NotFoundException(
        `Curso de supervivencia con ID ${id} no encontrado`,
      );
    }

    supervivencia.beneficiarios = supervivencia.beneficiarios.filter(
      (b) => b.id !== beneficiarioId,
    );
    return await this.supervivenciasRepository.save(supervivencia);
  }

  // Obtener estadísticas de un curso de supervivencia
  async getEstadisticas(id: string): Promise<any> {
    const supervivencia = await this.supervivenciasRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!supervivencia) {
      throw new NotFoundException(
        `Curso de supervivencia con ID ${id} no encontrado`,
      );
    }

    const totalBeneficiarios = supervivencia.beneficiarios?.length || 0;
    const capacidadDisponible =
      supervivencia.capacidad_maxima > 0
        ? supervivencia.capacidad_maxima - totalBeneficiarios
        : null;

    const porcentajeOcupacion =
      supervivencia.capacidad_maxima > 0
        ? ((totalBeneficiarios / supervivencia.capacidad_maxima) * 100).toFixed(
            2,
          )
        : null;

    return {
      supervivencia: {
        id: supervivencia.id,
        nombre: supervivencia.nombre,
        codigo: supervivencia.codigo,
      },
      estadisticas: {
        totalBeneficiarios,
        capacidadMaxima: supervivencia.capacidad_maxima || 'Sin límite',
        capacidadDisponible,
        porcentajeOcupacion: porcentajeOcupacion
          ? `${porcentajeOcupacion}%`
          : 'N/A',
      },
    };
  }

  private async conCursoBloqueado<T>(
    id: string,
    operacion: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return this.supervivenciasRepository.manager.transaction(
      async (manager) => {
        const curso = await manager
          .getRepository(Supervivencia)
          .createQueryBuilder('curso')
          .where('curso.id = :id', { id })
          .setLock('pessimistic_write')
          .getOne();
        if (!curso) {
          throw new NotFoundException(
            `Curso de supervivencia con ID ${id} no encontrado`,
          );
        }
        return operacion(manager);
      },
    );
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
      .getRepository(AsistenciaSupervivencia)
      .createQueryBuilder('registro')
      .select('DISTINCT CAST(registro.fecha AS text)', 'fecha')
      .where('registro.supervivencia_id = :id', { id })
      .andWhere('registro.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .getRawMany<{ fecha: string }>();
    const fotos = await manager
      .getRepository(FotoAsistenciaSupervivencia)
      .createQueryBuilder('registro')
      .select('DISTINCT CAST(registro.fecha AS text)', 'fecha')
      .where('registro.supervivencia_id = :id', { id })
      .andWhere('registro.fecha BETWEEN :inicio AND :fin', { inicio, fin })
      .getRawMany<{ fecha: string }>();
    return [...new Set([...asistencias, ...fotos].map((r) => r.fecha))].sort();
  }

  async getEncuentros(id: string, mes: string) {
    const { inicio, fin } = this.rangoMes(mes);
    await this.findOne(id);
    const manager = this.supervivenciasRepository.manager;
    const encuentros = await manager
      .getRepository(EncuentroSupervivencia)
      .find({
        where: { supervivencia: { id }, fecha: Between(inicio, fin) },
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
      const repository = manager.getRepository(EncuentroSupervivencia);
      const existentes = await repository.find({
        where: { supervivencia: { id }, fecha: Between(inicio, fin) },
      });
      const quitar = existentes.filter((e) => !dto.fechas.includes(e.fecha));
      if (quitar.length) await repository.delete(quitar.map((e) => e.id));
      const agregar = dto.fechas.filter(
        (fecha) => !existentes.some((e) => e.fecha === fecha),
      );
      if (agregar.length) {
        await repository.insert(
          agregar.map((fecha) => ({ supervivencia: { id }, fecha })),
        );
      }
      return { fechas: [...dto.fechas].sort(), fechasBloqueadas };
    });
  }

  private async validarEncuentro(
    manager: EntityManager,
    id: string,
    fecha: string,
  ) {
    if (
      !this.esFechaValida(fecha) ||
      !(await manager.getRepository(EncuentroSupervivencia).exists({
        where: { supervivencia: { id }, fecha },
      }))
    ) {
      throw new BadRequestException(
        'Solo puedes registrar asistencia o fotos en un encuentro configurado',
      );
    }
  }

  // Registrar asistencia para un curso de supervivencia
  async registrarAsistencia(
    id: string,
    registrarAsistenciaDto: RegistrarAsistenciaSupervivenciaDto,
  ): Promise<AsistenciaSupervivencia[]> {
    return this.conCursoBloqueado(id, async (manager) => {
      await this.validarEncuentro(manager, id, registrarAsistenciaDto.fecha);
      const supervivencia = await manager.getRepository(Supervivencia).findOne({
        where: { id },
        relations: ['beneficiarios', 'tutor'],
      });

      if (!supervivencia) {
        throw new NotFoundException(
          `Curso de supervivencia con ID ${id} no encontrado`,
        );
      }

      const fecha = new Date(registrarAsistenciaDto.fecha);
      const asistenciasGuardadas: AsistenciaSupervivencia[] = [];

      for (const asistenciaDto of registrarAsistenciaDto.asistencias) {
        // Verificar que el beneficiario esté inscrito en el curso
        const beneficiarioInscrito = supervivencia.beneficiarios?.find(
          (b) => b.id === asistenciaDto.beneficiario_id,
        );

        if (!beneficiarioInscrito) {
          throw new BadRequestException(
            `El beneficiario con ID ${asistenciaDto.beneficiario_id} no está inscrito en este curso`,
          );
        }

        // Buscar si ya existe asistencia para ese día
        let asistencia = await manager
          .getRepository(AsistenciaSupervivencia)
          .findOne({
            where: {
              supervivencia: { id },
              beneficiario: { id: asistenciaDto.beneficiario_id },
              fecha: fecha,
            },
          });

        if (asistencia) {
          // Actualizar asistencia existente
          asistencia.presente = asistenciaDto.presente;
          asistencia.observaciones = asistenciaDto.observaciones || undefined;
        } else {
          // Crear nueva asistencia
          asistencia = manager.getRepository(AsistenciaSupervivencia).create({
            supervivencia: { id } as Supervivencia,
            beneficiario: { id: asistenciaDto.beneficiario_id } as Beneficiario,
            fecha: fecha,
            presente: asistenciaDto.presente,
            observaciones: asistenciaDto.observaciones || undefined,
          });
        }

        asistenciasGuardadas.push(
          await manager.getRepository(AsistenciaSupervivencia).save(asistencia),
        );
      }

      return asistenciasGuardadas;
    });
  }

  // Obtener asistencias de un curso por fecha
  async getAsistenciasPorFecha(id: string, fecha: string): Promise<any> {
    const supervivencia = await this.supervivenciasRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!supervivencia) {
      throw new NotFoundException(
        `Curso de supervivencia con ID ${id} no encontrado`,
      );
    }

    const fechaDate = new Date(fecha);

    const asistencias = await this.asistenciasRepository.find({
      where: {
        supervivencia: { id },
        fecha: fechaDate,
      },
      relations: ['beneficiario'],
    });

    // Mapear beneficiarios con sus asistencias
    const beneficiariosConAsistencia =
      supervivencia.beneficiarios?.map((beneficiario) => {
        const asistencia = asistencias.find(
          (a) => a.beneficiario.id === beneficiario.id,
        );
        return {
          beneficiario: {
            id: beneficiario.id,
            nombre: beneficiario.nombre,
            apellido: beneficiario.apellido,
            codigo: beneficiario.codigo,
          },
          presente: asistencia?.presente ?? null,
          observaciones: asistencia?.observaciones ?? null,
          asistencia_id: asistencia?.id ?? null,
        };
      }) || [];

    return {
      fecha,
      supervivencia: {
        id: supervivencia.id,
        nombre: supervivencia.nombre,
        codigo: supervivencia.codigo,
      },
      asistencias: beneficiariosConAsistencia,
      estadisticas: {
        total: beneficiariosConAsistencia.length,
        presentes: beneficiariosConAsistencia.filter((a) => a.presente === true)
          .length,
        ausentes: beneficiariosConAsistencia.filter((a) => a.presente === false)
          .length,
        sinRegistrar: beneficiariosConAsistencia.filter(
          (a) => a.presente === null,
        ).length,
      },
    };
  }

  // Obtener historial de asistencias de un curso
  async getHistorialAsistencias(
    id: string,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<any> {
    const supervivencia = await this.findOne(id);

    const whereCondition: any = { supervivencia: { id } };

    if (fechaInicio && fechaFin) {
      whereCondition.fecha = Between(new Date(fechaInicio), new Date(fechaFin));
    }

    const asistencias = await this.asistenciasRepository.find({
      where: whereCondition,
      relations: ['beneficiario'],
      order: { fecha: 'DESC' },
    });

    // Agrupar por fecha
    const asistenciasPorFecha: Record<string, any[]> = {};
    asistencias.forEach((asistencia) => {
      const fechaKey = asistencia.fecha.toISOString().split('T')[0];
      if (!asistenciasPorFecha[fechaKey]) {
        asistenciasPorFecha[fechaKey] = [];
      }
      asistenciasPorFecha[fechaKey].push({
        beneficiario: {
          id: asistencia.beneficiario.id,
          nombre: asistencia.beneficiario.nombre,
          apellido: asistencia.beneficiario.apellido,
          codigo: asistencia.beneficiario.codigo,
        },
        presente: asistencia.presente,
        observaciones: asistencia.observaciones,
      });
    });

    return {
      supervivencia: {
        id: supervivencia.id,
        nombre: supervivencia.nombre,
        codigo: supervivencia.codigo,
      },
      historial: Object.entries(asistenciasPorFecha).map(
        ([fecha, registros]) => ({
          fecha,
          registros,
          estadisticas: {
            total: registros.length,
            presentes: registros.filter((r) => r.presente === true).length,
            ausentes: registros.filter((r) => r.presente === false).length,
          },
        }),
      ),
    };
  }

  // Obtener fechas con asistencias registradas para un curso
  async getFechasConAsistencia(id: string): Promise<string[]> {
    await this.findOne(id);

    const result = await this.asistenciasRepository
      .createQueryBuilder('asistencia')
      .select('DISTINCT CAST(asistencia.fecha AS text)', 'fecha')
      .where('asistencia.supervivencia_id = :id', { id })
      .orderBy('fecha', 'DESC')
      .getRawMany<{ fecha: string }>();

    return result.map((r) => r.fecha);
  }

  // ===================== FOTOS DE ASISTENCIA =====================

  // Subir foto de asistencia — permite múltiples fotos por supervivencia y fecha
  async subirFotoAsistencia(
    supervivenciaId: string,
    fecha: string,
    imagenBase64: string,
  ): Promise<FotoAsistenciaSupervivencia> {
    return this.conCursoBloqueado(supervivenciaId, async (manager) => {
      await this.validarEncuentro(manager, supervivenciaId, fecha);
      const supervivencia = await manager.getRepository(Supervivencia).findOne({
        where: { id: supervivenciaId },
      });

      if (!supervivencia) {
        throw new NotFoundException(
          `Curso de supervivencia con ID ${supervivenciaId} no encontrado`,
        );
      }

      const fechaDate = new Date(`${fecha}T12:00:00`);

      // Crear nuevo registro (se permiten múltiples fotos por supervivencia y fecha)
      const foto = manager.getRepository(FotoAsistenciaSupervivencia).create({
        supervivencia,
        fecha: fechaDate,
        imagen_url: imagenBase64,
      });

      return await manager
        .getRepository(FotoAsistenciaSupervivencia)
        .save(foto);
    });
  }

  // Obtener todas las fotos por supervivencia y fecha
  async getFotoAsistencia(
    supervivenciaId: string,
    fecha: string,
  ): Promise<FotoAsistenciaSupervivencia[]> {
    return await this.fotosRepository
      .createQueryBuilder('foto')
      .leftJoinAndSelect('foto.supervivencia', 'supervivencia')
      .where('supervivencia.id = :supervivenciaId', { supervivenciaId })
      .andWhere('DATE(foto.fecha) = DATE(:fecha)', { fecha })
      .orderBy('foto.creado_en', 'ASC')
      .getMany();
  }

  async eliminarFotoAsistencia(id: string): Promise<void> {
    const foto = await this.fotosRepository.findOne({ where: { id } });

    if (!foto) {
      throw new NotFoundException(`Foto con ID ${id} no encontrada`);
    }

    await this.fotosRepository.remove(foto);
  }
}
