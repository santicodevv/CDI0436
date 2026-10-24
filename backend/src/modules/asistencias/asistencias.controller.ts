import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';

import { AsistenciasService } from './asistencias.service';
import { CreateAsistenciaDto } from './dto/create-asistencia.dto';
import { UpdateAsistenciaDto } from './dto/update-asistencia.dto';
import { FilterAsistenciaDto } from './dto/filter-asistencia.dto';
import { RegistrarAsistenciaMasivaDto } from './dto/registrar-asistencia-masiva.dto';
import { MarcarTodosDto } from './dto/marcar-todos.dto';
import { JustificarMasivoDto } from './dto/justificar-masivo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermiso } from '../auth/decorators/permisos.decorator';
import { PaseListaTutorService } from './pase-lista-tutor.service';
import { ReportePaseListaDto } from './dto/reporte-pase-lista.dto';

@Controller('asistencias')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class AsistenciasController {
  constructor(
    private readonly asistenciasService: AsistenciasService,
    private readonly paseListaTutorService: PaseListaTutorService,
  ) {}

  @Get('reporte/tutor/:tutorId/pendientes')
  @RequierePermiso('reportes:ver')
  getPaseListaTutor(
    @Param('tutorId', ParseUUIDPipe) tutorId: string,
    @Query() filtros: ReportePaseListaDto,
  ) {
    return this.paseListaTutorService.generar(tutorId, filtros);
  }

  @Post()
  @RequierePermiso('asistencias:crear')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createAsistenciaDto: CreateAsistenciaDto) {
    return this.asistenciasService.create(createAsistenciaDto);
  }

  @Post('masiva')
  @RequierePermiso('asistencias:crear')
  @HttpCode(HttpStatus.CREATED)
  registrarAsistenciaMasiva(@Body() dto: RegistrarAsistenciaMasivaDto) {
    return this.asistenciasService.registrarAsistenciaMasiva(dto);
  }

  @Post('marcar-todos')
  @RequierePermiso('asistencias:crear')
  @HttpCode(HttpStatus.CREATED)
  marcarTodos(@Body() dto: MarcarTodosDto) {
    return this.asistenciasService.marcarTodos(dto);
  }

  @Post('justificar-masivo')
  @RequierePermiso('asistencias:editar')
  justificarMasivo(@Body() dto: JustificarMasivoDto) {
    return this.asistenciasService.justificarMasivo(dto);
  }

  @Get()
  @RequierePermiso('asistencias:ver')
  findAll(@Query() filters: FilterAsistenciaDto) {
    return this.asistenciasService.findAll(filters);
  }

  @Get('clase/:claseId/fecha/:fecha')
  @RequierePermiso('asistencias:ver')
  findByClaseYFecha(
    @Param('claseId', ParseUUIDPipe) claseId: string,
    @Param('fecha') fecha: string,
  ) {
    return this.asistenciasService.findByClaseYFecha(claseId, fecha);
  }

  @Get('reporte/clase/:claseId')
  @RequierePermiso('reportes:ver')
  getReportePorClase(
    @Param('claseId', ParseUUIDPipe) claseId: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.asistenciasService.getReportePorClase(
      claseId,
      fechaInicio,
      fechaFin,
    );
  }

  @Get('reporte/beneficiario/:beneficiarioId')
  @RequierePermiso('reportes:ver')
  getReportePorBeneficiario(
    @Param('beneficiarioId', ParseUUIDPipe) beneficiarioId: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.asistenciasService.getReportePorBeneficiario(
      beneficiarioId,
      fechaInicio,
      fechaFin,
    );
  }

  @Get('reporte/tutor/:tutorId')
  @RequierePermiso('reportes:ver')
  getReportePorTutor(
    @Param('tutorId', ParseUUIDPipe) tutorId: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.asistenciasService.getReportePorTutor(
      tutorId,
      fechaInicio,
      fechaFin,
    );
  }

  @Get('reporte/ausencias')
  @RequierePermiso('reportes:ver')
  getReporteAusenciasGeneral(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.asistenciasService.getReporteAusenciasGeneral(
      fechaInicio,
      fechaFin,
    );
  }

  @Get('reporte/global')
  @RequierePermiso('reportes:ver')
  getReporteGlobal(
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
    @Query('detallado') detallado?: string,
  ) {
    return this.asistenciasService.getReporteGlobal(
      fechaInicio,
      fechaFin,
      detallado === 'true',
    );
  }

  @Get('estadisticas/mensuales/:mes/:anio')
  @RequierePermiso('asistencias:ver')
  getEstadisticasMensuales(
    @Param('mes', ParseIntPipe) mes: number,
    @Param('anio', ParseIntPipe) anio: number,
  ) {
    return this.asistenciasService.getEstadisticasMensuales(mes, anio);
  }

  @Get('resumen/fecha/:fecha')
  @RequierePermiso('asistencias:ver')
  getResumenPorFecha(@Param('fecha') fecha: string) {
    return this.asistenciasService.getResumenPorFecha(fecha);
  }

  @Get(':id')
  @RequierePermiso('asistencias:ver')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.asistenciasService.findOne(id);
  }

  @Patch(':id')
  @RequierePermiso('asistencias:editar')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAsistenciaDto: UpdateAsistenciaDto,
  ) {
    return this.asistenciasService.update(id, updateAsistenciaDto);
  }

  @Delete(':id')
  @RequierePermiso('asistencias:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.asistenciasService.remove(id);
  }

  // ===================== FOTOS DE ASISTENCIA =====================

  @Post('foto')
  @RequierePermiso('asistencias:crear')
  @HttpCode(HttpStatus.CREATED)
  async subirFotoAsistencia(
    @Body('claseId') claseId: string,
    @Body('fecha') fecha: string,
    @Body('imagen') imagen: string,
  ) {
    if (!imagen) {
      throw new BadRequestException('No se proporcionó ninguna imagen');
    }

    if (!claseId || !fecha) {
      throw new BadRequestException('Debe proporcionar claseId y fecha');
    }

    // Validar que sea una imagen Base64 válida
    if (!imagen.startsWith('data:image/')) {
      throw new BadRequestException(
        'Formato de imagen inválido. Debe ser Base64',
      );
    }

    return this.asistenciasService.subirFotoAsistencia(claseId, fecha, imagen);
  }

  @Get('foto/:claseId/:fecha')
  @RequierePermiso('asistencias:ver')
  async getFotoAsistencia(
    @Param('claseId', ParseUUIDPipe) claseId: string,
    @Param('fecha') fecha: string,
  ) {
    return this.asistenciasService.getFotoAsistencia(claseId, fecha);
  }

  @Delete('foto/:id')
  @RequierePermiso('asistencias:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminarFotoAsistencia(@Param('id', ParseUUIDPipe) id: string) {
    return this.asistenciasService.eliminarFotoAsistencia(id);
  }
}
