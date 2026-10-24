import { GestorEncuentros } from '../../common/services/gestor-encuentros';
import { ConfigurarEncuentrosDto } from '../../common/dto/configurar-encuentros.dto';
import { EncuentroClub } from './encuentro-club.entity';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { Club } from './club.entity';
import { AsistenciaClub } from './asistencia-club.entity';
import { FotoAsistenciaClub } from './foto-asistencia-club.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { FilterClubDto } from './dto/filter-club.dto';
import { AgregarBeneficiariosClubDto } from './dto/agregar-beneficiarios.dto';
import { RegistrarAsistenciaClubDto } from './dto/registrar-asistencia.dto';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { Tutor } from '../tutores/tutor.entity';

@Injectable()
export class ClubsService {
  constructor(
    @InjectRepository(Club)
    private clubesRepository: Repository<Club>,
    @InjectRepository(Beneficiario)
    private beneficiariosRepository: Repository<Beneficiario>,
    @InjectRepository(AsistenciaClub)
    private asistenciasRepository: Repository<AsistenciaClub>,
    @InjectRepository(FotoAsistenciaClub)
    private fotosRepository: Repository<FotoAsistenciaClub>,
    @InjectRepository(Tutor)
    private tutoresRepository: Repository<Tutor>,
  ) {}

  async create(createClubDto: CreateClubDto): Promise<Club> {
    if (createClubDto.codigo) {
      const codigoExiste = await this.clubesRepository.findOne({
        where: { codigo: createClubDto.codigo },
      });

      if (codigoExiste) {
        throw new ConflictException(
          `Ya existe un club con el código ${createClubDto.codigo}`,
        );
      }
    }

    const { tutor_id, ...clubData } = createClubDto;
    const club = this.clubesRepository.create(clubData);

    if (tutor_id) {
      const tutor = await this.tutoresRepository.findOne({
        where: { id: tutor_id },
      });
      if (!tutor) {
        throw new NotFoundException(`Tutor con ID ${tutor_id} no encontrado`);
      }
      club.tutor = tutor;
    }

    return await this.clubesRepository.save(club);
  }

  async findAll(filters?: FilterClubDto): Promise<Club[]> {
    const query = this.clubesRepository
      .createQueryBuilder('club')
      .leftJoinAndSelect('club.beneficiarios', 'beneficiarios')
      .leftJoinAndSelect('club.tutor', 'tutor')
      .orderBy('club.nombre', 'ASC');

    if (filters) {
      if (filters.nombre) {
        query.andWhere('club.nombre ILIKE :nombre', {
          nombre: `%${filters.nombre}%`,
        });
      }

      if (filters.codigo) {
        query.andWhere('club.codigo ILIKE :codigo', {
          codigo: `%${filters.codigo}%`,
        });
      }

      if (filters.activo !== undefined) {
        query.andWhere('club.activo = :activo', {
          activo: filters.activo,
        });
      }
    }

    return await query.getMany();
  }

  async findOne(id: string): Promise<Club> {
    const club = await this.clubesRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!club) {
      throw new NotFoundException(`Club con ID ${id} no encontrado`);
    }

    return club;
  }

  async findByCodigo(codigo: string): Promise<Club> {
    const club = await this.clubesRepository.findOne({
      where: { codigo },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!club) {
      throw new NotFoundException(`Club con código ${codigo} no encontrado`);
    }

    return club;
  }

  async update(id: string, updateClubDto: UpdateClubDto): Promise<Club> {
    const club = await this.findOne(id);

    if (updateClubDto.codigo && updateClubDto.codigo !== club.codigo) {
      const codigoExiste = await this.clubesRepository.findOne({
        where: { codigo: updateClubDto.codigo },
      });

      if (codigoExiste) {
        throw new ConflictException(
          `Ya existe un club con el código ${updateClubDto.codigo}`,
        );
      }
    }

    const { tutor_id, ...clubData } = updateClubDto as any;
    Object.assign(club, clubData);

    if (tutor_id !== undefined) {
      if (tutor_id === null || tutor_id === '') {
        club.tutor = null as any;
      } else {
        const tutor = await this.tutoresRepository.findOne({
          where: { id: tutor_id },
        });
        if (!tutor) {
          throw new NotFoundException(`Tutor con ID ${tutor_id} no encontrado`);
        }
        club.tutor = tutor;
      }
    }

    return await this.clubesRepository.save(club);
  }

  async remove(id: string): Promise<void> {
    const club = await this.clubesRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!club) {
      throw new NotFoundException(`Club con ID ${id} no encontrado`);
    }

    if (club.beneficiarios && club.beneficiarios.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar el club porque tiene ${club.beneficiarios.length} beneficiario(s) inscrito(s)`,
      );
    }

    await this.clubesRepository.remove(club);
  }

  async softDelete(id: string): Promise<Club> {
    const club = await this.findOne(id);
    club.activo = false;
    return await this.clubesRepository.save(club);
  }

  async agregarBeneficiarios(
    id: string,
    agregarBeneficiariosDto: AgregarBeneficiariosClubDto,
  ): Promise<Club> {
    const club = await this.clubesRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!club) {
      throw new NotFoundException(`Club con ID ${id} no encontrado`);
    }

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

    const beneficiariosActuales = club.beneficiarios?.length || 0;
    const nuevosBeneficiarios = beneficiarios.filter(
      (b) => !club.beneficiarios?.some((cb) => cb.id === b.id),
    );

    if (club.capacidad_maxima > 0) {
      const totalDespues = beneficiariosActuales + nuevosBeneficiarios.length;
      if (totalDespues > club.capacidad_maxima) {
        throw new BadRequestException(
          `El club solo puede tener ${club.capacidad_maxima} beneficiarios. ` +
            `Actualmente tiene ${beneficiariosActuales} y se intentan agregar ${nuevosBeneficiarios.length}`,
        );
      }
    }

    club.beneficiarios = [
      ...(club.beneficiarios || []),
      ...nuevosBeneficiarios,
    ];
    return await this.clubesRepository.save(club);
  }

  async removerBeneficiario(id: string, beneficiarioId: string): Promise<Club> {
    const club = await this.clubesRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!club) {
      throw new NotFoundException(`Club con ID ${id} no encontrado`);
    }

    club.beneficiarios = club.beneficiarios.filter(
      (b) => b.id !== beneficiarioId,
    );
    return await this.clubesRepository.save(club);
  }

  async getEstadisticas(id: string): Promise<any> {
    const club = await this.clubesRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!club) {
      throw new NotFoundException(`Club con ID ${id} no encontrado`);
    }

    const totalBeneficiarios = club.beneficiarios?.length || 0;
    const capacidadDisponible =
      club.capacidad_maxima > 0
        ? club.capacidad_maxima - totalBeneficiarios
        : null;

    const porcentajeOcupacion =
      club.capacidad_maxima > 0
        ? ((totalBeneficiarios / club.capacidad_maxima) * 100).toFixed(2)
        : null;

    return {
      club: {
        id: club.id,
        nombre: club.nombre,
        codigo: club.codigo,
      },
      estadisticas: {
        totalBeneficiarios,
        capacidadMaxima: club.capacidad_maxima || 'Sin límite',
        capacidadDisponible,
        porcentajeOcupacion: porcentajeOcupacion
          ? `${porcentajeOcupacion}%`
          : 'N/A',
      },
    };
  }

  private get encuentros() {
    return new GestorEncuentros(this.clubesRepository.manager, {
      curso: Club,
      encuentro: EncuentroClub,
      asistencia: AsistenciaClub,
      foto: FotoAsistenciaClub,
      relacion: 'club',
    });
  }
  getEncuentros(id: string, mes: string) {
    return this.encuentros.getEncuentros(id, mes);
  }
  configurarEncuentros(id: string, dto: ConfigurarEncuentrosDto) {
    return this.encuentros.configurarEncuentros(id, dto);
  }

  async registrarAsistencia(
    id: string,
    registrarAsistenciaDto: RegistrarAsistenciaClubDto,
  ): Promise<AsistenciaClub[]> {
    return this.encuentros.conCursoBloqueado(id, async (manager) => {
      await this.encuentros.validarEncuentro(
        manager,
        id,
        registrarAsistenciaDto.fecha,
      );
      const club = await manager.getRepository(Club).findOne({
        where: { id },
        relations: ['beneficiarios', 'tutor'],
      });

      if (!club) {
        throw new NotFoundException(`Club con ID ${id} no encontrado`);
      }

      const fecha = new Date(registrarAsistenciaDto.fecha);
      const asistenciasGuardadas: AsistenciaClub[] = [];

      for (const asistenciaDto of registrarAsistenciaDto.asistencias) {
        const beneficiarioInscrito = club.beneficiarios?.find(
          (b) => b.id === asistenciaDto.beneficiario_id,
        );

        if (!beneficiarioInscrito) {
          throw new BadRequestException(
            `El beneficiario con ID ${asistenciaDto.beneficiario_id} no está inscrito en este club`,
          );
        }

        let asistencia = await manager.getRepository(AsistenciaClub).findOne({
          where: {
            club: { id },
            beneficiario: { id: asistenciaDto.beneficiario_id },
            fecha: fecha,
          },
        });

        if (asistencia) {
          asistencia.presente = asistenciaDto.presente;
          asistencia.observaciones = asistenciaDto.observaciones || undefined;
        } else {
          asistencia = manager.getRepository(AsistenciaClub).create({
            club: { id } as Club,
            beneficiario: { id: asistenciaDto.beneficiario_id } as Beneficiario,
            fecha: fecha,
            presente: asistenciaDto.presente,
            observaciones: asistenciaDto.observaciones || undefined,
          });
        }

        asistenciasGuardadas.push(
          await manager.getRepository(AsistenciaClub).save(asistencia),
        );
      }

      return asistenciasGuardadas;
    });
  }

  async getAsistenciasPorFecha(id: string, fecha: string): Promise<any> {
    const club = await this.clubesRepository.findOne({
      where: { id },
      relations: ['beneficiarios', 'tutor'],
    });

    if (!club) {
      throw new NotFoundException(`Club con ID ${id} no encontrado`);
    }

    const fechaDate = new Date(fecha);

    const asistencias = await this.asistenciasRepository.find({
      where: {
        club: { id },
        fecha: fechaDate,
      },
      relations: ['beneficiario'],
    });

    const beneficiariosConAsistencia =
      club.beneficiarios?.map((beneficiario) => {
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
      club: {
        id: club.id,
        nombre: club.nombre,
        codigo: club.codigo,
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

  async getHistorialAsistencias(
    id: string,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<any> {
    const club = await this.findOne(id);

    const whereCondition: any = { club: { id } };

    if (fechaInicio && fechaFin) {
      whereCondition.fecha = Between(new Date(fechaInicio), new Date(fechaFin));
    }

    const asistencias = await this.asistenciasRepository.find({
      where: whereCondition,
      relations: ['beneficiario'],
      order: { fecha: 'DESC' },
    });

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
      club: {
        id: club.id,
        nombre: club.nombre,
        codigo: club.codigo,
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

  async getFechasConAsistencia(id: string): Promise<string[]> {
    await this.findOne(id);

    const result = await this.asistenciasRepository
      .createQueryBuilder('asistencia')
      .select('DISTINCT CAST(asistencia.fecha AS text)', 'fecha')
      .where('asistencia.club_id = :id', { id })
      .orderBy('fecha', 'DESC')
      .getRawMany<{ fecha: string }>();

    return result.map((r) => r.fecha);
  }

  async subirFotoAsistencia(
    clubId: string,
    fecha: string,
    imagenBase64: string,
  ): Promise<FotoAsistenciaClub> {
    return this.encuentros.conCursoBloqueado(clubId, async (manager) => {
      await this.encuentros.validarEncuentro(manager, clubId, fecha);
      const club = await manager.getRepository(Club).findOne({
        where: { id: clubId },
      });

      if (!club) {
        throw new NotFoundException(`Club con ID ${clubId} no encontrado`);
      }

      const fechaDate = new Date(`${fecha}T12:00:00`);

      const foto = manager.getRepository(FotoAsistenciaClub).create({
        club,
        fecha: fechaDate,
        imagen_url: imagenBase64,
      });

      return await manager.getRepository(FotoAsistenciaClub).save(foto);
    });
  }

  async getFotoAsistencia(
    clubId: string,
    fecha: string,
  ): Promise<FotoAsistenciaClub[]> {
    return await this.fotosRepository
      .createQueryBuilder('foto')
      .leftJoinAndSelect('foto.club', 'club')
      .where('club.id = :clubId', { clubId })
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
