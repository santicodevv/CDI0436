import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Asistencia, EstadoAsistencia } from './asistencia.entity';
import { FotoAsistencia } from './foto-asistencia.entity';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { FilterAsistenciaDto } from './dto/filter-asistencia.dto';
import { RegistrarAsistenciaMasivaDto } from './dto/registrar-asistencia-masiva.dto';
import { MarcarTodosDto } from './dto/marcar-todos.dto';
import { JustificarMasivoDto } from './dto/justificar-masivo.dto';
import { Clase } from '../clases/clase.entity';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { Tutor } from '../tutores/tutor.entity';
import { fechasSinListaClase, validarPeriodoTutor } from './fechas-pase-lista';

@Injectable()
export class AsistenciasService {
  constructor(
    @InjectRepository(Asistencia)
    private asistenciasRepository: Repository<Asistencia>,
    @InjectRepository(Clase)
    private clasesRepository: Repository<Clase>,
    @InjectRepository(Beneficiario)
    private beneficiariosRepository: Repository<Beneficiario>,
    @InjectRepository(FotoAsistencia)
    private fotosAsistenciaRepository: Repository<FotoAsistencia>,
    @InjectRepository(Tutor)
    private tutoresRepository: Repository<Tutor>,
  ) {}

  async create(createAsistenciaDto: CreateAsistenciaDto): Promise<Asistencia> {
    // Verificar que la clase existe
    const clase = await this.clasesRepository.findOne({
      where: { id: createAsistenciaDto.claseId, activo: true },
    });

    if (!clase) {
      throw new NotFoundException(
        `Clase con ID ${createAsistenciaDto.claseId} no encontrada`,
      );
    }

    // Verificar que el beneficiario existe y está inscrito en la clase
    const beneficiario = await this.beneficiariosRepository.findOne({
      where: { id: createAsistenciaDto.beneficiarioId, activo: true },
      relations: ['clases'],
    });

    if (!beneficiario) {
      throw new NotFoundException(
        `Beneficiario con ID ${createAsistenciaDto.beneficiarioId} no encontrado`,
      );
    }

    const estaInscrito = beneficiario.clases.some(
      (c) => c.id === createAsistenciaDto.claseId,
    );
    if (!estaInscrito) {
      throw new BadRequestException(
        'El beneficiario no está inscrito en esta clase',
      );
    }

    // Verificar que no exista registro duplicado
    const existente = await this.asistenciasRepository.findOne({
      where: {
        clase: { id: createAsistenciaDto.claseId },
        beneficiario: { id: createAsistenciaDto.beneficiarioId },
        fecha: new Date(createAsistenciaDto.fecha),
      },
    });

    if (existente) {
      throw new ConflictException(
        'Ya existe un registro de asistencia para este beneficiario en esta fecha',
      );
    }

    // Establecer hora de registro si no se proporciona
    const horaRegistro =
      createAsistenciaDto.hora_registro ||
      new Date().toTimeString().split(' ')[0].substring(0, 5);

    const asistencia = this.asistenciasRepository.create({
      ...createAsistenciaDto,
      clase,
      beneficiario,
      fecha: new Date(createAsistenciaDto.fecha),
      hora_registro: horaRegistro,
    });

    return await this.asistenciasRepository.save(asistencia);
  }

  async findAll(filters?: FilterAsistenciaDto): Promise<Asistencia[]> {
    const query = this.asistenciasRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.clase', 'clase')
      .leftJoinAndSelect('asistencia.beneficiario', 'beneficiario')
      .leftJoinAndSelect('clase.tutor', 'tutor')
      .leftJoinAndSelect('clase.horarios', 'horario')
      .orderBy('asistencia.fecha', 'DESC')
      .addOrderBy('asistencia.hora_registro', 'DESC');

    if (filters) {
      if (filters.claseId) {
        query.andWhere('clase.id = :claseId', { claseId: filters.claseId });
      }

      if (filters.beneficiarioId) {
        query.andWhere('beneficiario.id = :beneficiarioId', {
          beneficiarioId: filters.beneficiarioId,
        });
      }

      if (filters.estado) {
        query.andWhere('asistencia.estado = :estado', {
          estado: filters.estado,
        });
      }

      if (filters.fechaInicio && filters.fechaFin) {
        query.andWhere('asistencia.fecha BETWEEN :fechaInicio AND :fechaFin', {
          fechaInicio: filters.fechaInicio,
          fechaFin: filters.fechaFin,
        });
      } else if (filters.fechaInicio) {
        query.andWhere('asistencia.fecha >= :fechaInicio', {
          fechaInicio: filters.fechaInicio,
        });
      } else if (filters.fechaFin) {
        query.andWhere('asistencia.fecha <= :fechaFin', {
          fechaFin: filters.fechaFin,
        });
      }
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Asistencia> {
    const asistencia = await this.asistenciasRepository.findOne({
      where: { id },
      relations: [
        'clase',
        'beneficiario',
        'clase.tutor',
        'clase.horarios',
        'registrado_por',
      ],
    });

    if (!asistencia) {
      throw new NotFoundException(`Asistencia con ID ${id} no encontrada`);
    }

    return asistencia;
  }

  async update(
    id: string,
    updateAsistenciaDto: UpdateAsistenciaDto,
  ): Promise<Asistencia> {
    const asistencia = await this.findOne(id);

    Object.assign(asistencia, updateAsistenciaDto);
    return await this.asistenciasRepository.save(asistencia);
  }

  async remove(id: string): Promise<void> {
    const asistencia = await this.findOne(id);
    await this.asistenciasRepository.remove(asistencia);
  }

  // Registrar asistencia masiva (toda la clase)
  async registrarAsistenciaMasiva(
    dto: RegistrarAsistenciaMasivaDto,
  ): Promise<Asistencia[]> {
    // Verificar que la clase existe
    const clase = await this.clasesRepository.findOne({
      where: { id: dto.claseId, activo: true },
      relations: ['beneficiarios'],
    });

    if (!clase) {
      throw new NotFoundException(`Clase con ID ${dto.claseId} no encontrada`);
    }

    // Verificar que todos los beneficiarios pertenecen a la clase
    const beneficiarioIds = dto.asistencias.map((a) => a.beneficiarioId);
    const beneficiariosClase = clase.beneficiarios.map((b) => b.id);

    const noInscritos = beneficiarioIds.filter(
      (id) => !beneficiariosClase.includes(id),
    );
    if (noInscritos.length > 0) {
      throw new BadRequestException(
        `Algunos beneficiarios no están inscritos en esta clase: ${noInscritos.join(', ')}`,
      );
    }

    const fecha = new Date(dto.fecha);
    const horaRegistro = new Date()
      .toTimeString()
      .split(' ')[0]
      .substring(0, 5);

    // Eliminar registros existentes para esta clase y fecha
    await this.asistenciasRepository.delete({
      clase: { id: dto.claseId },
      fecha: fecha,
    });

    // Crear nuevos registros
    const asistencias = dto.asistencias.map((a) => {
      const beneficiario = clase.beneficiarios.find(
        (b) => b.id === a.beneficiarioId,
      );
      return this.asistenciasRepository.create({
        clase,
        beneficiario,
        fecha,
        estado: a.estado,
        observaciones: a.observaciones,
        hora_registro: horaRegistro,
      });
    });

    return await this.asistenciasRepository.save(asistencias);
  }

  // Marcar asistencia para todos los beneficiarios de una clase
  async marcarTodos(dto: MarcarTodosDto): Promise<Asistencia[]> {
    const clase = await this.clasesRepository.findOne({
      where: { id: dto.claseId, activo: true },
      relations: ['beneficiarios'],
    });

    if (!clase) {
      throw new NotFoundException(`Clase con ID ${dto.claseId} no encontrada`);
    }

    if (!clase.beneficiarios || clase.beneficiarios.length === 0) {
      throw new BadRequestException(
        'La clase no tiene beneficiarios inscritos',
      );
    }

    const fecha = new Date(dto.fecha);
    const horaRegistro = new Date()
      .toTimeString()
      .split(' ')[0]
      .substring(0, 5);

    // Eliminar registros existentes
    await this.asistenciasRepository.delete({
      clase: { id: dto.claseId },
      fecha: fecha,
    });

    // Crear registros para todos los beneficiarios
    const asistencias = clase.beneficiarios.map((beneficiario) =>
      this.asistenciasRepository.create({
        clase,
        beneficiario,
        fecha,
        estado: dto.estado,
        observaciones: dto.observaciones,
        hora_registro: horaRegistro,
      }),
    );

    return await this.asistenciasRepository.save(asistencias);
  }

  // Justificar ausencias masivamente
  async justificarMasivo(dto: JustificarMasivoDto): Promise<Asistencia[]> {
    const fecha = new Date(dto.fecha);

    const asistencias = await this.asistenciasRepository.find({
      where: {
        clase: { id: dto.claseId },
        beneficiario: { id: In(dto.beneficiarioIds) },
        fecha: fecha,
        estado: EstadoAsistencia.AUSENTE,
      },
    });

    if (asistencias.length === 0) {
      throw new NotFoundException(
        'No se encontraron ausencias para justificar',
      );
    }

    asistencias.forEach((asistencia) => {
      asistencia.observaciones = dto.observaciones || asistencia.observaciones;
    });

    return await this.asistenciasRepository.save(asistencias);
  }

  // Obtener asistencia por clase y fecha
  async findByClaseYFecha(
    claseId: string,
    fecha: string,
  ): Promise<Asistencia[]> {
    return await this.asistenciasRepository.find({
      where: {
        clase: { id: claseId },
        fecha: new Date(fecha),
      },
      relations: ['beneficiario', 'clase'],
      order: { beneficiario: { nombre: 'ASC' } },
    });
  }

  // Obtener reporte de asistencia por clase
  async getReportePorClase(
    claseId: string,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<any> {
    const clase = await this.clasesRepository.findOne({
      where: { id: claseId },
      relations: ['tutor', 'horarios', 'beneficiarios'],
    });

    if (!clase) {
      throw new NotFoundException(`Clase con ID ${claseId} no encontrada`);
    }

    const query = this.asistenciasRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.beneficiario', 'beneficiario')
      .where('asistencia.clase.id = :claseId', { claseId });

    if (fechaInicio && fechaFin) {
      query.andWhere('asistencia.fecha BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio,
        fechaFin,
      });
    }

    const asistencias = await query.getMany();

    const totalRegistros = asistencias.length;
    const presentes = asistencias.filter(
      (a) => a.estado === EstadoAsistencia.PRESENTE,
    ).length;
    const ausentes = asistencias.filter(
      (a) => a.estado === EstadoAsistencia.AUSENTE,
    ).length;

    const porcentajeAsistencia =
      totalRegistros > 0
        ? ((presentes / totalRegistros) * 100).toFixed(2)
        : '0';

    return {
      clase: {
        id: clase.id,
        nombre: clase.nombre,
        codigo: clase.codigo,
        tutor: `${clase.tutor.nombre} ${clase.tutor.apellido || ''}`.trim(),
        horarios:
          clase.horarios
            ?.map((h) => `${h.dia} ${h.hora_inicio} - ${h.hora_fin}`)
            .join(', ') || 'Sin horario',
      },
      periodo: {
        fechaInicio: fechaInicio || 'Desde el inicio',
        fechaFin: fechaFin || 'Hasta la fecha',
      },
      estadisticas: {
        totalRegistros,
        presentes,
        ausentes,
        porcentajeAsistencia: `${porcentajeAsistencia}%`,
      },
      asistenciasPorBeneficiario: this.agruparPorBeneficiario(asistencias),
    };
  }

  // Obtener reporte de asistencia por beneficiario
  async getReportePorBeneficiario(
    beneficiarioId: string,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<any> {
    const beneficiario = await this.beneficiariosRepository.findOne({
      where: { id: beneficiarioId },
      relations: ['clases'],
    });

    if (!beneficiario) {
      throw new NotFoundException(
        `Beneficiario con ID ${beneficiarioId} no encontrado`,
      );
    }

    const query = this.asistenciasRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.clase', 'clase')
      .leftJoinAndSelect('clase.tutor', 'tutor')
      .where('asistencia.beneficiario.id = :beneficiarioId', {
        beneficiarioId,
      });

    if (fechaInicio && fechaFin) {
      query.andWhere('asistencia.fecha BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio,
        fechaFin,
      });
    }

    const asistencias = await query.getMany();

    const totalRegistros = asistencias.length;
    const presentes = asistencias.filter(
      (a) => a.estado === EstadoAsistencia.PRESENTE,
    ).length;
    const ausentes = asistencias.filter(
      (a) => a.estado === EstadoAsistencia.AUSENTE,
    ).length;

    const porcentajeAsistencia =
      totalRegistros > 0
        ? ((presentes / totalRegistros) * 100).toFixed(2)
        : '0';

    return {
      beneficiario: {
        id: beneficiario.id,
        codigo: beneficiario.codigo,
        nombre: `${beneficiario.nombre} ${beneficiario.apellido || ''}`.trim(),
        edad: beneficiario.fecha_nacimiento
          ? (() => {
              const nac = new Date(beneficiario.fecha_nacimiento);
              const hoy = new Date();
              let edad = hoy.getFullYear() - nac.getFullYear();
              if (
                hoy.getMonth() < nac.getMonth() ||
                (hoy.getMonth() === nac.getMonth() &&
                  hoy.getDate() < nac.getDate())
              )
                edad--;
              return edad;
            })()
          : null,
        padre_tutor: beneficiario.padre_tutor,
      },
      periodo: {
        fechaInicio: fechaInicio || 'Desde el inicio',
        fechaFin: fechaFin || 'Hasta la fecha',
      },
      estadisticas: {
        totalClasesInscritas: beneficiario.clases.length,
        totalRegistros,
        presentes,
        ausentes,
        porcentajeAsistencia: `${porcentajeAsistencia}%`,
      },
      asistenciasPorClase: this.agruparPorClase(asistencias),
    };
  }

  // Obtener reporte de asistencia por tutor
  async getReportePorTutor(
    tutorId: string,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<any> {
    validarPeriodoTutor(fechaInicio, fechaFin);
    const hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const tutor = await this.tutoresRepository.findOne({
      where: { id: tutorId },
    });

    if (!tutor) {
      throw new NotFoundException(`Tutor con ID ${tutorId} no encontrado`);
    }

    const clases = await this.clasesRepository.find({
      where: { tutor: { id: tutorId }, activo: true },
      relations: ['horarios', 'beneficiarios'],
    });

    const query = this.asistenciasRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.clase', 'clase')
      .where('clase.tutor.id = :tutorId', { tutorId });

    if (fechaInicio)
      query.andWhere('asistencia.fecha >= :fechaInicio', { fechaInicio });
    if (fechaFin) query.andWhere('asistencia.fecha <= :fechaFin', { fechaFin });

    const asistencias = await query.getMany();

    const asistenciasPorClase = clases.map((clase) => {
      const asistenciasClase = asistencias.filter(
        (a) => a.clase.id === clase.id,
      );

      const fechasUnicas = [
        ...new Set(
          asistenciasClase.map((a) => {
            const d = new Date(a.fecha);
            return d.toISOString().split('T')[0];
          }),
        ),
      ].sort();

      return {
        clase: {
          id: clase.id,
          nombre: clase.nombre,
          codigo: clase.codigo,
          horarios:
            clase.horarios
              ?.map((h) => `${h.dia} ${h.hora_inicio} - ${h.hora_fin}`)
              .join(', ') || 'Sin horario',
          totalInscritos: clase.beneficiarios?.length || 0,
        },
        estadisticas: {
          diasConAsistenciaRegistrada: fechasUnicas.length,
        },
        fechasRegistro: fechasUnicas,
        fechasSinRegistro: clase.beneficiarios?.some((b) => b.activo)
          ? fechasSinListaClase(
              clase.horarios || [],
              fechasUnicas,
              clase.creado_en,
              fechaInicio,
              fechaFin,
              hoy,
            )
          : [],
      };
    });

    const todasLasFechasUnicas = [
      ...new Set(
        asistencias.map((a) => {
          const d = new Date(a.fecha);
          return d.toISOString().split('T')[0];
        }),
      ),
    ].sort();

    return {
      tutor: {
        id: tutor.id,
        nombre: `${tutor.nombre} ${tutor.apellido || ''}`.trim(),
        especialidad: tutor.especialidad,
      },
      periodo: {
        fechaInicio: fechaInicio || 'Desde el inicio',
        fechaFin: fechaFin || 'Hasta la fecha',
      },
      estadisticas: {
        totalClasesAsignadas: clases.length,
        totalDiasConRegistroGlobal: todasLasFechasUnicas.length,
      },
      clases: asistenciasPorClase,
      resumenFechasGlobal: todasLasFechasUnicas,
    };
  }

  // Obtener reporte general de ausencias
  async getReporteAusenciasGeneral(
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<any> {
    console.log('getReporteAusenciasGeneral called with:', {
      fechaInicio,
      fechaFin,
    });
    const query = this.asistenciasRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.clase', 'clase')
      .leftJoinAndSelect('asistencia.beneficiario', 'beneficiario')
      .leftJoinAndSelect('clase.tutor', 'tutor')
      .where('asistencia.estado = :estado', {
        estado: EstadoAsistencia.AUSENTE,
      })
      .orderBy('asistencia.fecha', 'ASC');

    if (fechaInicio && fechaFin) {
      query.andWhere('asistencia.fecha BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio,
        fechaFin,
      });
    } else if (fechaInicio) {
      query.andWhere('asistencia.fecha >= :fechaInicio', { fechaInicio });
    } else if (fechaFin) {
      query.andWhere('asistencia.fecha <= :fechaFin', { fechaFin });
    }

    const asistencias = await query.getMany();

    // Agrupar por beneficiario + clase
    const grupos = new Map<
      string,
      {
        beneficiario: any;
        clase: any;
        tutor: any;
        fechas: string[];
      }
    >();

    for (const a of asistencias) {
      const clave = `${a.beneficiario.id}__${a.clase.id}`;
      if (!grupos.has(clave)) {
        grupos.set(clave, {
          beneficiario: {
            id: a.beneficiario.id,
            nombre:
              `${a.beneficiario.nombre} ${a.beneficiario.apellido || ''}`.trim(),
            codigo: a.beneficiario.codigo,
            telefono: a.beneficiario.telefono || '-',
            padre_tutor: a.beneficiario.padre_tutor || '-',
            direccion: a.beneficiario.direccion || '-',
          },
          clase: {
            id: a.clase.id,
            nombre: a.clase.nombre,
            codigo: a.clase.codigo,
          },
          tutor: {
            id: a.clase.tutor?.id,
            nombre: a.clase.tutor
              ? `${a.clase.tutor.nombre} ${a.clase.tutor.apellido || ''}`.trim()
              : 'Sin tutor',
          },
          fechas: [],
        });
      }
      const fecha =
        typeof a.fecha === 'string'
          ? a.fecha
          : a.fecha.toISOString().slice(0, 10);
      grupos.get(clave)!.fechas.push(fecha);
    }

    const registros = Array.from(grupos.values()).sort(
      (a, b) => b.fechas.length - a.fechas.length,
    );

    return {
      periodo: {
        fechaInicio: fechaInicio || 'Desde el inicio',
        fechaFin: fechaFin || 'Hasta la fecha',
      },
      estadisticas: {
        totalAusencias: asistencias.length,
        totalBeneficiariosAusentes: new Set(
          asistencias.map((a) => a.beneficiario.id),
        ).size,
        totalRegistros: registros.length,
      },
      registros,
    };
  }

  // Obtener reporte global de todas las clases
  async getReporteGlobal(
    fechaInicio?: string,
    fechaFin?: string,
    detallado: boolean = false,
  ): Promise<any> {
    // Obtener todas las clases activas
    const clases = await this.clasesRepository.find({
      where: { activo: true },
      relations: ['tutor', 'horarios', 'beneficiarios'],
      order: { nombre: 'ASC' },
    });

    // Construir query de asistencias
    const query = this.asistenciasRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.clase', 'clase')
      .leftJoinAndSelect('asistencia.beneficiario', 'beneficiario')
      .leftJoinAndSelect('clase.tutor', 'tutor')
      .where('clase.activo = :activo', { activo: true });

    if (fechaInicio && fechaFin) {
      query.andWhere('asistencia.fecha BETWEEN :fechaInicio AND :fechaFin', {
        fechaInicio,
        fechaFin,
      });
    } else if (fechaInicio) {
      query.andWhere('asistencia.fecha >= :fechaInicio', { fechaInicio });
    } else if (fechaFin) {
      query.andWhere('asistencia.fecha <= :fechaFin', { fechaFin });
    }

    const asistencias = await query.getMany();

    // Estadísticas globales - contar beneficiarios únicos
    const totalRegistros = asistencias.length;

    // Agrupar asistencias por beneficiario para contar únicos
    const asistenciasPorBeneficiarioMap = new Map<
      string,
      { presente: boolean; ausente: boolean }
    >();

    asistencias.forEach((a) => {
      const benefId = a.beneficiario.id;
      if (!asistenciasPorBeneficiarioMap.has(benefId)) {
        asistenciasPorBeneficiarioMap.set(benefId, {
          presente: false,
          ausente: false,
        });
      }
      const registro = asistenciasPorBeneficiarioMap.get(benefId)!;

      // Si vino al menos una vez (presente), marcar como presente
      if (a.estado === EstadoAsistencia.PRESENTE) {
        registro.presente = true;
      }
      // Si tiene al menos un ausente
      if (a.estado === EstadoAsistencia.AUSENTE) {
        registro.ausente = true;
      }
    });

    // Contar beneficiarios únicos que asistieron al menos una vez
    let beneficiariosPresentes = 0;
    let beneficiariosAusentes = 0;

    asistenciasPorBeneficiarioMap.forEach((registro) => {
      if (registro.presente) {
        beneficiariosPresentes++;
      } else if (registro.ausente) {
        // Solo cuenta como ausente si NUNCA vino (no tiene ningún presente)
        beneficiariosAusentes++;
      }
    });

    const totalBeneficiariosConRegistro = asistenciasPorBeneficiarioMap.size;
    const porcentajeAsistencia =
      totalBeneficiariosConRegistro > 0
        ? (
            (beneficiariosPresentes / totalBeneficiariosConRegistro) *
            100
          ).toFixed(2)
        : '0';

    // Agrupar por clase
    const asistenciasPorClase = clases.map((clase) => {
      const asistenciasClase = asistencias.filter(
        (a) => a.clase.id === clase.id,
      );
      const totalClase = asistenciasClase.length;

      // Contar beneficiarios únicos por clase
      const beneficiariosPorClaseMap = new Map<
        string,
        { presente: boolean; ausente: boolean }
      >();

      asistenciasClase.forEach((a) => {
        const benefId = a.beneficiario.id;
        if (!beneficiariosPorClaseMap.has(benefId)) {
          beneficiariosPorClaseMap.set(benefId, {
            presente: false,
            ausente: false,
          });
        }
        const registro = beneficiariosPorClaseMap.get(benefId)!;

        if (a.estado === EstadoAsistencia.PRESENTE) {
          registro.presente = true;
        }
        if (a.estado === EstadoAsistencia.AUSENTE) {
          registro.ausente = true;
        }
      });

      let presentesClase = 0;
      let ausentesClase = 0;

      beneficiariosPorClaseMap.forEach((registro) => {
        if (registro.presente) {
          presentesClase++;
        } else if (registro.ausente) {
          ausentesClase++;
        }
      });

      const totalBeneficiariosClase = beneficiariosPorClaseMap.size;
      const porcentajeClase =
        totalBeneficiariosClase > 0
          ? ((presentesClase / totalBeneficiariosClase) * 100).toFixed(2)
          : '0';

      const resultado: any = {
        clase: {
          id: clase.id,
          nombre: clase.nombre,
          codigo: clase.codigo,
          tutor: clase.tutor
            ? `${clase.tutor.nombre} ${clase.tutor.apellido || ''}`.trim()
            : 'Sin tutor',
          totalBeneficiarios: clase.beneficiarios?.length || 0,
        },
        estadisticas: {
          totalRegistros: totalClase,
          beneficiariosPresentes: presentesClase,
          beneficiariosAusentes: ausentesClase,
          porcentajeAsistencia: `${porcentajeClase}%`,
        },
      };

      // Si es detallado, incluir asistencias por beneficiario
      if (detallado) {
        resultado.asistenciasPorBeneficiario =
          this.agruparPorBeneficiario(asistenciasClase);
      }

      return resultado;
    });

    return {
      periodo: {
        fechaInicio: fechaInicio || 'Desde el inicio',
        fechaFin: fechaFin || 'Hasta la fecha',
      },
      resumen: {
        totalClases: clases.length,
        totalBeneficiariosUnicos: new Set(
          asistencias.map((a) => a.beneficiario.id),
        ).size,
        totalBeneficiariosInscritos: clases.reduce(
          (acc, c) => acc + (c.beneficiarios?.length || 0),
          0,
        ),
      },
      estadisticasGlobales: {
        totalRegistros,
        beneficiariosPresentes,
        beneficiariosAusentes,
        porcentajeAsistencia: `${porcentajeAsistencia}%`,
      },
      detallado,
      asistenciasPorClase,
    };
  }

  // Método auxiliar para agrupar por beneficiario
  private agruparPorBeneficiario(asistencias: Asistencia[]): any[] {
    const agrupado = asistencias.reduce((acc, asistencia) => {
      const key = asistencia.beneficiario.id;
      if (!acc[key]) {
        acc[key] = {
          beneficiario: {
            id: asistencia.beneficiario.id,
            codigo: asistencia.beneficiario.codigo,
            nombre:
              `${asistencia.beneficiario.nombre} ${asistencia.beneficiario.apellido || ''}`.trim(),
          },
          registros: [],
        };
      }
      acc[key].registros.push({
        fecha: asistencia.fecha,
        estado: asistencia.estado,
        observaciones: asistencia.observaciones,
      });
      return acc;
    }, {});

    return Object.values(agrupado);
  }

  // Método auxiliar para agrupar por clase
  private agruparPorClase(asistencias: Asistencia[]): any[] {
    const agrupado = asistencias.reduce((acc, asistencia) => {
      const key = asistencia.clase.id;
      if (!acc[key]) {
        acc[key] = {
          clase: {
            id: asistencia.clase.id,
            nombre: asistencia.clase.nombre,
            codigo: asistencia.clase.codigo,
          },
          registros: [],
        };
      }
      acc[key].registros.push({
        fecha: asistencia.fecha,
        estado: asistencia.estado,
        observaciones: asistencia.observaciones,
      });
      return acc;
    }, {});

    return Object.values(agrupado);
  }

  // Obtener resumen de asistencia por fecha (para módulo Nutrición)
  async getResumenPorFecha(fecha: string): Promise<any[]> {
    const clases = await this.clasesRepository.find({
      where: { activo: true },
      relations: ['beneficiarios', 'tutor', 'horarios'],
      order: { nombre: 'ASC' },
    });

    const fechaDate = new Date(fecha);

    const resumen = await Promise.all(
      clases.map(async (clase) => {
        const asistencias = await this.asistenciasRepository.find({
          where: {
            clase: { id: clase.id },
            fecha: fechaDate,
            estado: EstadoAsistencia.PRESENTE,
          },
        });

        return {
          claseId: clase.id,
          nombre: clase.nombre,
          codigo: clase.codigo,
          tutor: clase.tutor
            ? `${clase.tutor.nombre} ${clase.tutor.apellido || ''}`.trim()
            : null,
          totalInscritos: clase.beneficiarios?.length || 0,
          totalPresentes: asistencias.length,
        };
      }),
    );

    return resumen;
  }

  // Obtener estadísticas mensuales
  async getEstadisticasMensuales(mes: number, anio: number): Promise<any> {
    const fechaInicio = new Date(anio, mes - 1, 1);
    const fechaFin = new Date(anio, mes, 0);

    const asistencias = await this.asistenciasRepository.find({
      where: {
        fecha: Between(fechaInicio, fechaFin),
      },
      relations: ['clase', 'beneficiario'],
    });

    const totalRegistros = asistencias.length;
    const presentes = asistencias.filter(
      (a) => a.estado === EstadoAsistencia.PRESENTE,
    ).length;
    const ausentes = asistencias.filter(
      (a) => a.estado === EstadoAsistencia.AUSENTE,
    ).length;

    return {
      periodo: {
        mes,
        anio,
        fechaInicio,
        fechaFin,
      },
      estadisticas: {
        totalRegistros,
        presentes,
        ausentes,
        porcentajeAsistencia:
          totalRegistros > 0
            ? `${((presentes / totalRegistros) * 100).toFixed(2)}%`
            : '0%',
      },
    };
  }

  // ===================== FOTOS DE ASISTENCIA =====================

  // Subir foto de asistencia (Base64) — permite múltiples fotos por clase y fecha
  async subirFotoAsistencia(
    claseId: string,
    fecha: string,
    imagenBase64: string,
  ): Promise<FotoAsistencia> {
    // Verificar que la clase existe
    const clase = await this.clasesRepository.findOne({
      where: { id: claseId, activo: true },
    });

    if (!clase) {
      throw new NotFoundException(`Clase con ID ${claseId} no encontrada`);
    }

    // Crear fecha correctamente para evitar problemas de zona horaria
    const fechaDate = new Date(`${fecha}T12:00:00`);

    // Crear nuevo registro (se permiten múltiples fotos por clase y fecha)
    const fotoAsistencia = this.fotosAsistenciaRepository.create({
      clase,
      fecha: fechaDate,
      imagen_url: imagenBase64,
    });

    return await this.fotosAsistenciaRepository.save(fotoAsistencia);
  }

  // Obtener todas las fotos por clase y fecha
  async getFotoAsistencia(
    claseId: string,
    fecha: string,
  ): Promise<FotoAsistencia[]> {
    // Usar query builder para comparar solo la parte de la fecha (YYYY-MM-DD)
    // Esto evita problemas de zona horaria
    return await this.fotosAsistenciaRepository
      .createQueryBuilder('foto')
      .leftJoinAndSelect('foto.clase', 'clase')
      .where('clase.id = :claseId', { claseId })
      .andWhere('DATE(foto.fecha) = DATE(:fecha)', { fecha })
      .orderBy('foto.creado_en', 'ASC')
      .getMany();
  }

  // Eliminar foto de asistencia
  async eliminarFotoAsistencia(id: string): Promise<void> {
    const foto = await this.fotosAsistenciaRepository.findOne({
      where: { id },
    });

    if (!foto) {
      throw new NotFoundException(`Foto con ID ${id} no encontrada`);
    }

    await this.fotosAsistenciaRepository.remove(foto);
  }
}
