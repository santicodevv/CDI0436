import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DeepPartial, IsNull } from 'typeorm';
import { Beneficiario } from './beneficiario.entity';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto';
import { FilterBeneficiarioDto } from './dto/filter-beneficiario.dto';
import { AsignarClaseDto } from './dto/asignar-clase.dto';
import { Clase } from '../clases/clase.entity';
import { EstadoAsistencia } from '../asistencias/asistencia.entity';
import { BeneficiarioExpediente } from './beneficiario-expediente.entity';
import {
  BeneficiarioMudanza,
  ResultadoMudanza,
} from './beneficiario-mudanza.entity';
import type {
  FinalizarMudanzaDto,
  RegistrarMudanzaDto,
} from './dto/beneficiario-mudanza.dto';
import * as XLSX from 'xlsx';

interface ImportOptionsDto {
  actualizarExistentes?: boolean;
  omitirErrores?: boolean;
}

function calcularEdad(
  fechaNacimiento: Date | string | null | undefined,
): number | null {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento);
  if (isNaN(nacimiento.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mesActual = hoy.getMonth();
  const mesNacimiento = nacimiento.getMonth();
  if (
    mesActual < mesNacimiento ||
    (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())
  ) {
    edad--;
  }
  return edad;
}

@Injectable()
export class BeneficiariosService {
  constructor(
    @InjectRepository(Beneficiario)
    private beneficiariosRepository: Repository<Beneficiario>,
    @InjectRepository(Clase)
    private clasesRepository: Repository<Clase>,
    @InjectRepository(BeneficiarioExpediente)
    private expedientesRepository: Repository<BeneficiarioExpediente>,
  ) {}

  async create(
    createBeneficiarioDto: CreateBeneficiarioDto,
  ): Promise<Beneficiario> {
    const existe = await this.beneficiariosRepository.findOne({
      where: { codigo: createBeneficiarioDto.codigo },
    });

    if (existe) {
      throw new ConflictException(
        `Ya existe un beneficiario con el código ${createBeneficiarioDto.codigo}`,
      );
    }

    const beneficiario = this.beneficiariosRepository.create(
      createBeneficiarioDto,
    );
    return await this.beneficiariosRepository.save(beneficiario);
  }

  async findAll(filters?: FilterBeneficiarioDto): Promise<Beneficiario[]> {
    const query = this.beneficiariosRepository
      .createQueryBuilder('beneficiario')
      .leftJoinAndSelect('beneficiario.clases', 'clases')
      .leftJoinAndSelect('clases.tutor', 'tutor')
      .leftJoinAndSelect('clases.horarios', 'horario')
      .leftJoinAndSelect('beneficiario.supervivencias', 'supervivencias')
      .orderBy('beneficiario.nombre', 'ASC');

    if (filters) {
      if (filters.nombre) {
        query.andWhere(
          '(beneficiario.nombre ILIKE :nombre OR beneficiario.apellido ILIKE :nombre)',
          { nombre: `%${filters.nombre}%` },
        );
      }

      if (filters.codigo) {
        query.andWhere('beneficiario.codigo ILIKE :codigo', {
          codigo: `%${filters.codigo}%`,
        });
      }

      if (filters.correo) {
        query.andWhere('beneficiario.correo ILIKE :correo', {
          correo: `%${filters.correo}%`,
        });
      }

      if (filters.padre_tutor) {
        query.andWhere('beneficiario.padre_tutor ILIKE :padre_tutor', {
          padre_tutor: `%${filters.padre_tutor}%`,
        });
      }

      if (filters.activo !== undefined) {
        query.andWhere('beneficiario.activo = :activo', {
          activo: filters.activo,
        });
      }

      if (filters.edadMin !== undefined) {
        // Filter by calculated age from fecha_nacimiento
        const fechaMax = new Date();
        fechaMax.setFullYear(fechaMax.getFullYear() - filters.edadMin);
        query.andWhere('beneficiario.fecha_nacimiento <= :fechaMax', {
          fechaMax: fechaMax.toISOString().split('T')[0],
        });
      }

      if (filters.edadMax !== undefined) {
        const fechaMin = new Date();
        fechaMin.setFullYear(fechaMin.getFullYear() - filters.edadMax - 1);
        query.andWhere('beneficiario.fecha_nacimiento >= :fechaMin', {
          fechaMin: fechaMin.toISOString().split('T')[0],
        });
      }
    }

    return await query.getMany();
  }

  async buscarPublico(nombre: string): Promise<any[]> {
    const beneficiarios = await this.beneficiariosRepository
      .createQueryBuilder('beneficiario')
      .leftJoinAndSelect('beneficiario.clases', 'clase')
      .leftJoinAndSelect('clase.tutor', 'tutor')
      .where('beneficiario.activo = :activo', { activo: true })
      .andWhere(
        "(beneficiario.nombre ILIKE :nombre OR beneficiario.apellido ILIKE :nombre OR CONCAT(beneficiario.nombre, ' ', beneficiario.apellido) ILIKE :nombre)",
        { nombre: `%${nombre}%` },
      )
      .orderBy('beneficiario.nombre', 'ASC')
      .take(10)
      .getMany();

    return beneficiarios.map((b) => {
      // Obtener el profesor de la primera clase activa
      const clase = b.clases?.find((c) => c.activo);
      const profesor = clase?.tutor;

      return {
        id: b.id,
        codigo: b.codigo,
        nombre: b.nombre,
        apellido: b.apellido,
        padre_tutor: b.padre_tutor,
        telefono: b.telefono,
        profesor_nombre: profesor
          ? `${profesor.nombre} ${profesor.apellido || ''}`.trim()
          : null,
      };
    });
  }

  async findOne(id: string): Promise<Beneficiario> {
    const beneficiario = await this.beneficiariosRepository.findOne({
      where: { id },
      relations: [
        'clases',
        'clases.tutor',
        'clases.horarios',
        'asistencias',
        'supervivencias',
      ],
    });

    if (!beneficiario) {
      throw new NotFoundException(`Beneficiario con ID ${id} no encontrado`);
    }

    return beneficiario;
  }

  async findByCodigo(codigo: string): Promise<Beneficiario> {
    const beneficiario = await this.beneficiariosRepository.findOne({
      where: { codigo },
      relations: [
        'clases',
        'clases.tutor',
        'clases.horarios',
        'supervivencias',
      ],
    });

    if (!beneficiario) {
      throw new NotFoundException(
        `Beneficiario con código ${codigo} no encontrado`,
      );
    }

    return beneficiario;
  }

  async update(
    id: string,
    updateBeneficiarioDto: UpdateBeneficiarioDto,
  ): Promise<Beneficiario> {
    const beneficiario = await this.findOne(id);

    if (
      updateBeneficiarioDto.codigo &&
      updateBeneficiarioDto.codigo !== beneficiario.codigo
    ) {
      const existe = await this.beneficiariosRepository.findOne({
        where: { codigo: updateBeneficiarioDto.codigo },
      });

      if (existe) {
        throw new ConflictException(
          `Ya existe un beneficiario con el código ${updateBeneficiarioDto.codigo}`,
        );
      }
    }

    Object.assign(beneficiario, updateBeneficiarioDto);
    return await this.beneficiariosRepository.save(beneficiario);
  }

  async remove(id: string): Promise<void> {
    const beneficiario = await this.beneficiariosRepository.findOne({
      where: { id },
      relations: ['clases', 'asistencias'],
    });

    if (!beneficiario) {
      throw new NotFoundException(`Beneficiario con ID ${id} no encontrado`);
    }

    if (beneficiario.clases && beneficiario.clases.length > 0) {
      throw new BadRequestException(
        `No se puede eliminar el beneficiario porque está inscrito en ${beneficiario.clases.length} clase(s). Remuévalo de las clases primero.`,
      );
    }

    // Eliminar asistencias asociadas antes de eliminar el beneficiario
    if (beneficiario.asistencias && beneficiario.asistencias.length > 0) {
      await this.beneficiariosRepository.manager.remove(
        beneficiario.asistencias,
      );
    }

    await this.beneficiariosRepository.remove(beneficiario);
  }

  async softDelete(id: string): Promise<Beneficiario> {
    const beneficiario = await this.findOne(id);

    // Toggle active state
    beneficiario.activo = !beneficiario.activo;

    // Si se está desactivando, remover de todas las clases
    if (!beneficiario.activo) {
      if (beneficiario.clases && beneficiario.clases.length > 0) {
        for (const clase of beneficiario.clases) {
          await this.clasesRepository
            .createQueryBuilder()
            .relation(Clase, 'beneficiarios')
            .of(clase.id)
            .remove(beneficiario.id);
        }
        beneficiario.clases = [];
      }
    }

    return await this.beneficiariosRepository.save(beneficiario);
  }

  getMudanzas(id: string): Promise<BeneficiarioMudanza[]> {
    return this.beneficiariosRepository.manager.find(BeneficiarioMudanza, {
      where: { beneficiario_id: id },
      order: { registrado_en: 'DESC' },
    });
  }

  registrarMudanza(
    id: string,
    data: RegistrarMudanzaDto,
    usuario: { id: string; nombre: string },
  ): Promise<BeneficiarioMudanza> {
    return this.beneficiariosRepository.manager.transaction(async (manager) => {
      const beneficiario = await manager.findOne(Beneficiario, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!beneficiario) {
        throw new NotFoundException('Beneficiario no encontrado');
      }
      if (!beneficiario.activo) {
        throw new ConflictException('El beneficiario está inactivo');
      }

      const pendiente = await manager.exists(BeneficiarioMudanza, {
        where: { beneficiario_id: id, resultado: IsNull() },
      });
      if (pendiente) {
        throw new ConflictException(
          'El beneficiario ya tiene una mudanza pendiente',
        );
      }

      const mudanza = manager.create(BeneficiarioMudanza, {
        direccion: data.direccion.trim(),
        telefono: data.telefono.trim(),
        cuidador: data.cuidador.trim(),
        beneficiario_id: id,
        registrado_por_id: usuario.id,
        registrado_por: usuario.nombre,
      });
      return manager.save(mudanza);
    });
  }

  finalizarMudanza(
    id: string,
    mudanzaId: string,
    data: FinalizarMudanzaDto,
    usuario: { id: string; nombre: string },
  ): Promise<BeneficiarioMudanza> {
    return this.beneficiariosRepository.manager.transaction(async (manager) => {
      const beneficiario = await manager.findOne(Beneficiario, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!beneficiario) {
        throw new NotFoundException('Beneficiario no encontrado');
      }

      const mudanza = await manager.findOneBy(BeneficiarioMudanza, {
        id: mudanzaId,
        beneficiario_id: id,
      });
      if (!mudanza) throw new NotFoundException('Mudanza no encontrada');
      if (mudanza.resultado) {
        throw new ConflictException('La mudanza ya fue finalizada');
      }

      for (const nombre of ['clases', 'clubes', 'supervivencias']) {
        const relacion = manager
          .createQueryBuilder()
          .relation(Beneficiario, nombre)
          .of(id);
        const inscripciones = await relacion.loadMany<{ id: string }>();
        if (inscripciones.length) {
          await relacion.remove(
            inscripciones.map((inscripcion) => inscripcion.id),
          );
        }
      }
      await manager.update(Beneficiario, id, { activo: false });

      mudanza.resultado = data.resultado;
      mudanza.centro_receptor =
        data.resultado === ResultadoMudanza.TRASLADO
          ? (data.centro_receptor?.trim() ?? null)
          : null;
      mudanza.finalizado_por_id = usuario.id;
      mudanza.finalizado_por = usuario.nombre;
      mudanza.finalizado_en = new Date();
      return manager.save(mudanza);
    });
  }

  async asignarClases(
    id: string,
    asignarClaseDto: AsignarClaseDto,
  ): Promise<Beneficiario> {
    const beneficiario = await this.findOne(id);

    const clases = await this.clasesRepository.find({
      where: { id: In(asignarClaseDto.claseIds) },
    });

    if (clases.length !== asignarClaseDto.claseIds.length) {
      throw new NotFoundException('Una o más clases no fueron encontradas');
    }

    for (const clase of clases) {
      const claseCompleta = await this.clasesRepository.findOne({
        where: { id: clase.id },
        relations: ['beneficiarios'],
      });

      if (!claseCompleta) {
        throw new NotFoundException(`Clase con ID ${clase.id} no encontrada`);
      }

      const capacidad = claseCompleta.capacidad_maxima ?? 0;
      const inscritos = claseCompleta.beneficiarios?.length ?? 0;

      if (capacidad > 0 && inscritos >= capacidad) {
        throw new BadRequestException(
          `La clase ${claseCompleta.nombre} ha alcanzado su capacidad máxima`,
        );
      }
    }

    const clasesExistentes = beneficiario.clases || [];
    const nuevasClases = clases.filter(
      (clase) => !clasesExistentes.some((c) => c.id === clase.id),
    );

    beneficiario.clases = [...clasesExistentes, ...nuevasClases];
    return await this.beneficiariosRepository.save(beneficiario);
  }

  async removerDeClase(id: string, claseId: string): Promise<Beneficiario> {
    const beneficiario = await this.findOne(id);

    beneficiario.clases = beneficiario.clases.filter(
      (clase) => clase.id !== claseId,
    );
    return await this.beneficiariosRepository.save(beneficiario);
  }

  async findByClase(claseId: string): Promise<Beneficiario[]> {
    return await this.beneficiariosRepository
      .createQueryBuilder('beneficiario')
      .leftJoin('beneficiario.clases', 'clase')
      .where('clase.id = :claseId', { claseId })
      .andWhere('beneficiario.activo = :activo', { activo: true })
      .orderBy('beneficiario.nombre', 'ASC')
      .getMany();
  }

  async getEstadisticas(id: string): Promise<any> {
    const beneficiario = await this.beneficiariosRepository.findOne({
      where: { id },
      relations: ['clases', 'asistencias'],
    });

    if (!beneficiario) {
      throw new NotFoundException(`Beneficiario con ID ${id} no encontrado`);
    }

    const totalClases = beneficiario.clases?.length || 0;
    const totalAsistencias = beneficiario.asistencias?.length || 0;
    const presentes =
      beneficiario.asistencias?.filter(
        (a) => a.estado === EstadoAsistencia.PRESENTE,
      ).length || 0;
    const ausentes =
      beneficiario.asistencias?.filter(
        (a) => a.estado === EstadoAsistencia.AUSENTE,
      ).length || 0;

    const porcentajeAsistencia =
      totalAsistencias > 0
        ? ((presentes / totalAsistencias) * 100).toFixed(2)
        : 0;

    return {
      beneficiario: {
        id: beneficiario.id,
        codigo: beneficiario.codigo,
        nombre: `${beneficiario.nombre} ${beneficiario.apellido || ''}`.trim(),
        edad: calcularEdad(beneficiario.fecha_nacimiento),
      },
      estadisticas: {
        totalClasesInscritas: totalClases,
        totalAsistenciasRegistradas: totalAsistencias,
        presentes,
        ausentes,
        porcentajeAsistencia: `${porcentajeAsistencia}%`,
      },
    };
  }

  async importarDesdeExcel(
    buffer: Buffer,
    options?: ImportOptionsDto,
  ): Promise<{
    exitosos: number;
    fallidos: number;
    errores: Array<{ fila: number; error: string; datos: any }>;
    beneficiarios: Beneficiario[];
  }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: null,
    });

    const resultados = {
      exitosos: 0,
      fallidos: 0,
      errores: [] as Array<{ fila: number; error: string; datos: any }>,
      beneficiarios: [] as Beneficiario[],
    };

    for (let i = 0; i < data.length; i++) {
      const fila = data[i] as any;
      const numeroFila = i + 2;

      try {
        if (!fila.CODIGO || !fila.NOMBRE) {
          throw new Error('Faltan campos requeridos: CODIGO y NOMBRE');
        }

        // Parse fecha de nacimiento from various column names
        let fechaNacimiento: Date | undefined = undefined;
        const fechaRaw =
          fila['FECHA_NACIMIENTO'] ||
          fila['FECHA DE NACIMIENTO'] ||
          fila['FECHA NACIMIENTO'] ||
          fila.FECHA_NACIMIENTO;
        if (fechaRaw) {
          const parsed = new Date(fechaRaw);
          if (!isNaN(parsed.getTime())) {
            fechaNacimiento = parsed;
          }
        }

        const beneficiarioData: Partial<Beneficiario> = {
          codigo: String(fila.CODIGO).trim(),
          nombre: String(fila.NOMBRE).trim(),
          apellido: fila.APELLIDO ? String(fila.APELLIDO).trim() : undefined,
          direccion: fila.DIRECCION ? String(fila.DIRECCION).trim() : undefined,
          telefono: fila.TELEFONO ? String(fila.TELEFONO).trim() : undefined,
          padre_tutor:
            fila['PADRE O TUTOR'] || fila.PADRE_TUTOR
              ? String(fila['PADRE O TUTOR'] || fila.PADRE_TUTOR).trim()
              : undefined,
          fecha_nacimiento: fechaNacimiento,
          correo: fila.CORREO ? String(fila.CORREO).trim() : undefined,
          activo: true,
        };

        const existente = await this.beneficiariosRepository.findOne({
          where: { codigo: beneficiarioData.codigo },
        });

        let nuevoBeneficiario: Beneficiario;

        if (existente) {
          if (options?.actualizarExistentes) {
            Object.assign(existente, beneficiarioData);
            nuevoBeneficiario =
              await this.beneficiariosRepository.save(existente);
            resultados.exitosos++;
          } else {
            throw new Error(`El código ${beneficiarioData.codigo} ya existe`);
          }
        } else {
          const entidad = this.beneficiariosRepository.create(
            beneficiarioData as DeepPartial<Beneficiario>,
          );

          const guardado = await this.beneficiariosRepository.save(entidad);
          nuevoBeneficiario = Array.isArray(guardado) ? guardado[0] : guardado;
          resultados.exitosos++;
        }

        resultados.beneficiarios.push(nuevoBeneficiario);
      } catch (error: any) {
        resultados.fallidos++;
        resultados.errores.push({
          fila: numeroFila,
          error: error?.message || String(error),
          datos: fila,
        });

        if (!options?.omitirErrores) {
          throw new BadRequestException({
            message: 'Error al importar beneficiarios',
            detalles: resultados,
          });
        }
      }
    }

    return resultados;
  }

  generarPlantillaExcel(): Buffer {
    const plantilla = [
      {
        CODIGO: 'BEN001',
        NOMBRE: 'Juan',
        APELLIDO: 'Pérez',
        DIRECCION: 'Calle Principal #123',
        TELEFONO: '809-555-1234',
        'PADRE O TUTOR': 'María Pérez',
        'FECHA DE NACIMIENTO': '2009-03-15',
        CORREO: 'juan.perez@example.com',
      },
      {
        CODIGO: 'BEN002',
        NOMBRE: 'Ana',
        APELLIDO: 'González',
        DIRECCION: 'Av. Independencia #456',
        TELEFONO: '809-555-5678',
        'PADRE O TUTOR': 'Pedro González',
        'FECHA DE NACIMIENTO': '2010-07-22',
        CORREO: 'ana.gonzalez@example.com',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(plantilla);

    const columnWidths = [
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 25 },
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Beneficiarios');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async getCumpleanosPorMes(mes: number): Promise<any[]> {
    if (mes < 1 || mes > 12) {
      throw new BadRequestException('El mes debe estar entre 1 y 12');
    }

    const beneficiarios = await this.beneficiariosRepository
      .createQueryBuilder('beneficiario')
      .where('beneficiario.activo = :activo', { activo: true })
      .andWhere('beneficiario.fecha_nacimiento IS NOT NULL')
      .andWhere('EXTRACT(MONTH FROM beneficiario.fecha_nacimiento) = :mes', {
        mes,
      })
      .orderBy('EXTRACT(DAY FROM beneficiario.fecha_nacimiento)', 'ASC')
      .addOrderBy('beneficiario.nombre', 'ASC')
      .getMany();

    return beneficiarios.map((b) => {
      const fechaNac = new Date(b.fecha_nacimiento);
      return {
        id: b.id,
        codigo: b.codigo,
        nombre: `${b.nombre} ${b.apellido || ''}`.trim(),
        dia: fechaNac.getDate(),
        fecha_nacimiento: b.fecha_nacimiento,
        edad: calcularEdad(b.fecha_nacimiento),
        telefono: b.telefono,
        padre_tutor: b.padre_tutor,
      };
    });
  }

  async getExpedientes(
    beneficiarioId: string,
  ): Promise<BeneficiarioExpediente[]> {
    return await this.expedientesRepository.find({
      where: { beneficiario: { id: beneficiarioId } },
      order: { creado_en: 'DESC' },
    });
  }

  async addExpediente(
    beneficiarioId: string,
    data: Partial<BeneficiarioExpediente>,
  ): Promise<BeneficiarioExpediente> {
    const beneficiario = await this.findOne(beneficiarioId);
    const expediente = this.expedientesRepository.create({
      ...data,
      beneficiario,
    });
    return await this.expedientesRepository.save(expediente);
  }

  async deleteExpediente(id: string): Promise<void> {
    const expediente = await this.expedientesRepository.findOne({
      where: { id },
    });
    if (!expediente) throw new NotFoundException('Expediente no encontrado');
    await this.expedientesRepository.remove(expediente);
  }

  async updateExpediente(
    id: string,
    data: Partial<BeneficiarioExpediente>,
  ): Promise<BeneficiarioExpediente> {
    const expediente = await this.expedientesRepository.findOne({
      where: { id },
    });
    if (!expediente) throw new NotFoundException('Expediente no encontrado');
    Object.assign(expediente, data);
    return await this.expedientesRepository.save(expediente);
  }

  async exportarAExcel(filters?: FilterBeneficiarioDto): Promise<Buffer> {
    const beneficiarios = await this.findAll(filters);

    const data = beneficiarios.map((b) => ({
      CODIGO: b.codigo,
      NOMBRE: b.nombre,
      APELLIDO: b.apellido || '',
      DIRECCION: b.direccion || '',
      TELEFONO: b.telefono || '',
      'PADRE O TUTOR': b.padre_tutor || '',
      'FECHA DE NACIMIENTO': b.fecha_nacimiento
        ? new Date(b.fecha_nacimiento).toISOString().split('T')[0]
        : '',
      EDAD: calcularEdad(b.fecha_nacimiento) ?? '',
      CORREO: b.correo || '',
      ESTADO: b.activo ? 'Activo' : 'Inactivo',
      'FECHA REGISTRO': new Date(b.creado_en).toLocaleDateString('es-DO'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    const columnWidths = [
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 8 },
      { wch: 25 },
      { wch: 10 },
      { wch: 15 },
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Beneficiarios');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  async getReporteCarpetas(
    tipoExpediente?: string,
    condicion?: string,
  ): Promise<any> {
    const beneficiarios = await this.beneficiariosRepository.find({
      where: { activo: true },
      relations: ['expedientes'],
      order: { nombre: 'ASC' },
    });

    const isTodosExpedientes = !tipoExpediente || tipoExpediente === 'todos';
    const isTodasCondiciones = !condicion || condicion === 'todos';

    const resultados: any[] = [];
    let conRegistros = 0;
    let sinRegistros = 0;

    for (const b of beneficiarios) {
      // Filtrar expedientes según el tipo solicitado
      const expedientesFiltrados = isTodosExpedientes
        ? b.expedientes
        : b.expedientes.filter((e) => e.tipo === tipoExpediente);

      const tieneRegistros =
        expedientesFiltrados && expedientesFiltrados.length > 0;

      // Aplicar filtro de condición
      if (!isTodasCondiciones) {
        if (condicion === 'con_registros' && !tieneRegistros) continue;
        if (condicion === 'sin_registros' && tieneRegistros) continue;
      }

      if (tieneRegistros) conRegistros++;
      else sinRegistros++;

      resultados.push({
        beneficiario: {
          id: b.id,
          nombre: b.nombre + (b.apellido ? ` ${b.apellido}` : ''),
          codigo: b.codigo,
        },
        tieneRegistros,
        expedientes: expedientesFiltrados.map((e) => ({
          id: e.id,
          titulo: e.titulo || e.tipo,
          tipo: e.tipo,
          fecha: e.fecha_evento || e.creado_en,
        })),
      });
    }

    return {
      estadisticas: {
        totalEvaluados: resultados.length,
        conRegistros,
        sinRegistros,
      },
      registros: resultados,
    };
  }
}
