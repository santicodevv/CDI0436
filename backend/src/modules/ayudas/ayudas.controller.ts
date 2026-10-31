import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { AyudasService } from './ayudas.service';
import { CreateAyudaDto } from './dto/create-ayuda.dto';
import { UpdateEstadoAyudaDto } from './dto/update-estado-ayuda.dto';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateFotoEntregaDto } from './dto/update-foto-entrega.dto';
import { UpdateDisponibilidadAyudasDto } from './dto/update-disponibilidad-ayudas.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermiso } from '../auth/decorators/permisos.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('ayudas')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class AyudasController {
  constructor(private readonly ayudasService: AyudasService) {}

  @Public()
  @Post()
  create(@Body() createAyudaDto: CreateAyudaDto) {
    return this.ayudasService.create(createAyudaDto);
  }

  // Consultado por el formulario público para saber si acepta solicitudes.
  @Public()
  @Get('disponibilidad')
  getDisponibilidad() {
    return this.ayudasService.getDisponibilidad();
  }

  @Patch('disponibilidad')
  @RequierePermiso('ayudas:disponibilidad')
  updateDisponibilidad(
    @Body() dto: UpdateDisponibilidadAyudasDto,
    @CurrentUser() usuario: { nombre?: string },
  ) {
    return this.ayudasService.updateDisponibilidad(dto, usuario?.nombre);
  }

  @Get()
  @RequierePermiso('ayudas:ver')
  findAll() {
    return this.ayudasService.findAll();
  }

  @Get('exportar')
  @RequierePermiso('reportes:exportar')
  async exportar(@Res() res: Response) {
    const buffer = await this.ayudasService.exportarAExcel();

    const fecha = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=ayudas_${fecha}.xlsx`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get(':id')
  @RequierePermiso('ayudas:ver')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ayudasService.findOne(id);
  }

  @Patch(':id/estado')
  @RequierePermiso('ayudas:editar')
  updateEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEstadoDto: UpdateEstadoAyudaDto,
  ) {
    return this.ayudasService.updateEstado(id, updateEstadoDto);
  }

  @Patch(':id/foto-entrega')
  @RequierePermiso('ayudas:editar')
  updateFotoEntrega(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFotoEntregaDto: UpdateFotoEntregaDto,
  ) {
    return this.ayudasService.updateFotoEntrega(id, updateFotoEntregaDto);
  }

  @Delete(':id')
  @RequierePermiso('ayudas:eliminar')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ayudasService.remove(id);
  }

  // Endpoints para comentarios
  @Post(':id/comentarios')
  @RequierePermiso('ayudas:editar')
  createComentario(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createComentarioDto: CreateComentarioDto,
  ) {
    return this.ayudasService.createComentario(id, createComentarioDto);
  }

  @Get(':id/comentarios')
  @RequierePermiso('ayudas:ver')
  getComentarios(@Param('id', ParseUUIDPipe) id: string) {
    return this.ayudasService.getComentarios(id);
  }
}
