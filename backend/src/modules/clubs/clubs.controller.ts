import {
  ConfigurarEncuentrosDto,
  MesEncuentrosDto,
} from '../../common/dto/configurar-encuentros.dto';
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
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { FilterClubDto } from './dto/filter-club.dto';
import { AgregarBeneficiariosClubDto } from './dto/agregar-beneficiarios.dto';
import { RegistrarAsistenciaClubDto } from './dto/registrar-asistencia.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermiso } from '../auth/decorators/permisos.decorator';

@Controller('clubes')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class ClubsController {
  constructor(private readonly clubsService: ClubsService) {}

  @Post()
  @RequierePermiso('clubs:crear')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createClubDto: CreateClubDto) {
    return this.clubsService.create(createClubDto);
  }

  @Get()
  @RequierePermiso('clubs:ver')
  findAll(@Query() filters: FilterClubDto) {
    return this.clubsService.findAll(filters);
  }

  @Get('codigo/:codigo')
  @RequierePermiso('clubs:ver')
  findByCodigo(@Param('codigo') codigo: string) {
    return this.clubsService.findByCodigo(codigo);
  }

  @Get(':id')
  @RequierePermiso('clubs:ver')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.clubsService.findOne(id);
  }

  @Get(':id/estadisticas')
  @RequierePermiso('clubs:ver')
  getEstadisticas(@Param('id', ParseUUIDPipe) id: string) {
    return this.clubsService.getEstadisticas(id);
  }

  @Patch(':id')
  @RequierePermiso('clubs:editar')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateClubDto: UpdateClubDto,
  ) {
    return this.clubsService.update(id, updateClubDto);
  }

  @Post(':id/beneficiarios')
  @RequierePermiso('clubs:editar')
  agregarBeneficiarios(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() agregarBeneficiariosDto: AgregarBeneficiariosClubDto,
  ) {
    return this.clubsService.agregarBeneficiarios(id, agregarBeneficiariosDto);
  }

  @Delete(':id/beneficiarios/:beneficiarioId')
  @RequierePermiso('clubs:editar')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerBeneficiario(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('beneficiarioId', ParseUUIDPipe) beneficiarioId: string,
  ) {
    return this.clubsService.removerBeneficiario(id, beneficiarioId);
  }

  @Delete(':id')
  @RequierePermiso('clubs:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.clubsService.remove(id);
  }

  @Patch(':id/desactivar')
  @RequierePermiso('clubs:editar')
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.clubsService.softDelete(id);
  }

  @Get(':id/encuentros')
  @RequierePermiso('clubs:ver')
  getEncuentros(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: MesEncuentrosDto,
  ) {
    return this.clubsService.getEncuentros(id, query.mes);
  }
  @Patch(':id/encuentros')
  @RequierePermiso('clubs:editar')
  configurarEncuentros(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfigurarEncuentrosDto,
  ) {
    return this.clubsService.configurarEncuentros(id, dto);
  }

  @Post(':id/asistencias')
  @RequierePermiso('clubs:editar')
  @HttpCode(HttpStatus.CREATED)
  registrarAsistencia(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() registrarAsistenciaDto: RegistrarAsistenciaClubDto,
  ) {
    return this.clubsService.registrarAsistencia(id, registrarAsistenciaDto);
  }

  @Get(':id/asistencias')
  @RequierePermiso('clubs:ver')
  getAsistenciasPorFecha(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fecha') fecha: string,
  ) {
    return this.clubsService.getAsistenciasPorFecha(id, fecha);
  }

  @Get(':id/asistencias/historial')
  @RequierePermiso('clubs:ver')
  getHistorialAsistencias(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.clubsService.getHistorialAsistencias(id, fechaInicio, fechaFin);
  }

  @Get(':id/asistencias/fechas')
  @RequierePermiso('clubs:ver')
  getFechasConAsistencia(@Param('id', ParseUUIDPipe) id: string) {
    return this.clubsService.getFechasConAsistencia(id);
  }

  @Post(':id/asistencias/foto')
  @RequierePermiso('clubs:editar')
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

    return this.clubsService.subirFotoAsistencia(id, fecha, imagen);
  }

  @Get(':id/asistencias/foto/:fecha')
  @RequierePermiso('clubs:ver')
  async getFotoAsistencia(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fecha') fecha: string,
  ) {
    return this.clubsService.getFotoAsistencia(id, fecha);
  }

  @Delete(':id/asistencias/foto/:fotoId')
  @RequierePermiso('clubs:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  async eliminarFotoAsistencia(@Param('fotoId', ParseUUIDPipe) fotoId: string) {
    return this.clubsService.eliminarFotoAsistencia(fotoId);
  }
}
