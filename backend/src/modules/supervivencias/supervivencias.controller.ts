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
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { SupervivenciasService } from './supervivencias.service';
import { CreateSupervivenciaDto } from './dto/create-supervivencia.dto';
import { UpdateSupervivenciaDto } from './dto/update-supervivencia.dto';
import { FilterSupervivenciaDto } from './dto/filter-supervivencia.dto';
import { AgregarBeneficiariosSupervivenciaDto } from './dto/agregar-beneficiarios.dto';
import { RegistrarAsistenciaSupervivenciaDto } from './dto/registrar-asistencia.dto';
import {
  ConfigurarEncuentrosDto,
  MesEncuentrosDto,
} from './dto/configurar-encuentros.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermiso } from '../auth/decorators/permisos.decorator';

@Controller('supervivencias')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class SupervivenciasController {
  constructor(private readonly supervivenciasService: SupervivenciasService) {}

  @Post()
  @RequierePermiso('supervivencia:crear')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createSupervivenciaDto: CreateSupervivenciaDto) {
    return this.supervivenciasService.create(createSupervivenciaDto);
  }

  @Get()
  @RequierePermiso('supervivencia:ver')
  findAll(@Query() filters: FilterSupervivenciaDto) {
    return this.supervivenciasService.findAll(filters);
  }

  @Get('codigo/:codigo')
  @RequierePermiso('supervivencia:ver')
  findByCodigo(@Param('codigo') codigo: string) {
    return this.supervivenciasService.findByCodigo(codigo);
  }

  @Get(':id')
  @RequierePermiso('supervivencia:ver')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.supervivenciasService.findOne(id);
  }

  @Get(':id/estadisticas')
  @RequierePermiso('supervivencia:ver')
  getEstadisticas(@Param('id', ParseUUIDPipe) id: string) {
    return this.supervivenciasService.getEstadisticas(id);
  }

  @Patch(':id')
  @RequierePermiso('supervivencia:editar')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupervivenciaDto: UpdateSupervivenciaDto,
  ) {
    return this.supervivenciasService.update(id, updateSupervivenciaDto);
  }

  @Post(':id/beneficiarios')
  @RequierePermiso('supervivencia:editar')
  agregarBeneficiarios(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() agregarBeneficiariosDto: AgregarBeneficiariosSupervivenciaDto,
  ) {
    return this.supervivenciasService.agregarBeneficiarios(
      id,
      agregarBeneficiariosDto,
    );
  }

  @Delete(':id/beneficiarios/:beneficiarioId')
  @RequierePermiso('supervivencia:editar')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerBeneficiario(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('beneficiarioId', ParseUUIDPipe) beneficiarioId: string,
  ) {
    return this.supervivenciasService.removerBeneficiario(id, beneficiarioId);
  }

  @Delete(':id')
  @RequierePermiso('supervivencia:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.supervivenciasService.remove(id);
  }

  @Patch(':id/desactivar')
  @RequierePermiso('supervivencia:editar')
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.supervivenciasService.softDelete(id);
  }

  @Get(':id/encuentros')
  @RequierePermiso('supervivencia:ver')
  getEncuentros(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: MesEncuentrosDto,
  ) {
    return this.supervivenciasService.getEncuentros(id, query.mes);
  }

  @Patch(':id/encuentros')
  @RequierePermiso('supervivencia:editar')
  configurarEncuentros(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfigurarEncuentrosDto,
  ) {
    return this.supervivenciasService.configurarEncuentros(id, dto);
  }

  // Endpoints de asistencia
  @Post(':id/asistencias')
  @RequierePermiso('supervivencia:editar')
  @HttpCode(HttpStatus.CREATED)
  registrarAsistencia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() registrarAsistenciaDto: RegistrarAsistenciaSupervivenciaDto,
  ) {
    return this.supervivenciasService.registrarAsistencia(
      id,
      registrarAsistenciaDto,
    );
  }

  @Get(':id/asistencias')
  @RequierePermiso('supervivencia:ver')
  getAsistenciasPorFecha(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fecha') fecha: string,
  ) {
    return this.supervivenciasService.getAsistenciasPorFecha(id, fecha);
  }

  @Get(':id/asistencias/historial')
  @RequierePermiso('supervivencia:ver')
  getHistorialAsistencias(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.supervivenciasService.getHistorialAsistencias(
      id,
      fechaInicio,
      fechaFin,
    );
  }

  @Get(':id/asistencias/fechas')
  @RequierePermiso('supervivencia:ver')
  getFechasConAsistencia(@Param('id', ParseUUIDPipe) id: string) {
    return this.supervivenciasService.getFechasConAsistencia(id);
  }

  // ===================== FOTOS DE ASISTENCIA =====================

  @Post(':id/asistencias/foto')
  @RequierePermiso('supervivencia:editar')
  @HttpCode(HttpStatus.CREATED)
  async subirFotoAsistencia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('fecha') fecha: string,
    @Body('imagen') imagen: string,
  ) {
    if (!imagen)
      throw new BadRequestException('No se proporcionó ninguna imagen');
    if (!fecha) throw new BadRequestException('Debe proporcionar la fecha');
    if (!imagen.startsWith('data:image/'))
      throw new BadRequestException(
        'Formato de imagen inválido. Debe ser Base64',
      );

    return this.supervivenciasService.subirFotoAsistencia(id, fecha, imagen);
  }

  @Get(':id/asistencias/foto/:fecha')
  @RequierePermiso('supervivencia:ver')
  async getFotoAsistencia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fecha') fecha: string,
  ) {
    return this.supervivenciasService.getFotoAsistencia(id, fecha);
  }

  @Delete(':id/asistencias/foto/:fotoId')
  @RequierePermiso('supervivencia:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminarFotoAsistencia(@Param('fotoId', ParseUUIDPipe) fotoId: string) {
    return this.supervivenciasService.eliminarFotoAsistencia(fotoId);
  }
}
