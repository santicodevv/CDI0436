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
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { BeneficiariosService } from './beneficiarios.service';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto';
import { UpdateBeneficiarioDto } from './dto/update-beneficiario.dto';
import { FilterBeneficiarioDto } from './dto/filter-beneficiario.dto';
import { AsignarClaseDto } from './dto/asignar-clase.dto';
import { ImportOptionsDto } from './dto/import-beneficiarios.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermiso } from '../auth/decorators/permisos.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  FinalizarMudanzaDto,
  RegistrarMudanzaDto,
} from './dto/beneficiario-mudanza.dto';

@Controller('beneficiarios')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class BeneficiariosController {
  constructor(private readonly beneficiariosService: BeneficiariosService) {}

  @Post()
  @RequierePermiso('beneficiarios:crear')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBeneficiarioDto: CreateBeneficiarioDto) {
    return this.beneficiariosService.create(createBeneficiarioDto);
  }

  @Get()
  @RequierePermiso('beneficiarios:ver')
  findAll(@Query() filters: FilterBeneficiarioDto) {
    return this.beneficiariosService.findAll(filters);
  }

  // --- Static routes MUST come before :id ---

  @Get('reporte/carpetas')
  @RequierePermiso('reportes:ver')
  getReporteCarpetas(
    @Query('tipoExpediente') tipoExpediente?: string,
    @Query('condicion') condicion?: string,
  ) {
    return this.beneficiariosService.getReporteCarpetas(
      tipoExpediente,
      condicion,
    );
  }

  @Get('exportar')
  @RequierePermiso('reportes:exportar')
  async exportar(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        skipMissingProperties: true,
        forbidNonWhitelisted: false,
      }),
    )
    filters: FilterBeneficiarioDto,
    @Res() res: Response,
  ) {
    const buffer = await this.beneficiariosService.exportarAExcel(filters);

    const fecha = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=beneficiarios_${fecha}.xlsx`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('plantilla/descargar')
  @RequierePermiso('beneficiarios:crear')
  descargarPlantilla(@Res() res: Response) {
    const buffer = this.beneficiariosService.generarPlantillaExcel();

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename=plantilla_beneficiarios.xlsx',
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Post('importar')
  @RequierePermiso('beneficiarios:crear')
  @UseInterceptors(FileInterceptor('file'))
  async importar(
    @UploadedFile() file: Express.Multer.File,
    @Body() options?: ImportOptionsDto,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const allowedMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'El archivo debe ser un Excel (.xlsx o .xls)',
      );
    }

    return await this.beneficiariosService.importarDesdeExcel(
      file.buffer,
      options,
    );
  }

  @Public()
  @Get('buscar-publico')
  buscarPublico(@Query('nombre') nombre: string) {
    if (!nombre || nombre.trim().length < 2) {
      return [];
    }
    return this.beneficiariosService.buscarPublico(nombre.trim());
  }

  @Get('clase/:claseId')
  @RequierePermiso('beneficiarios:ver')
  findByClase(@Param('claseId', ParseUUIDPipe) claseId: string) {
    return this.beneficiariosService.findByClase(claseId);
  }

  @Get('codigo/:codigo')
  @RequierePermiso('beneficiarios:ver')
  findByCodigo(@Param('codigo') codigo: string) {
    return this.beneficiariosService.findByCodigo(codigo);
  }

  @Get('cumpleanos/:mes')
  @RequierePermiso('cumpleanos:ver')
  getCumpleanosPorMes(@Param('mes', ParseIntPipe) mes: number) {
    return this.beneficiariosService.getCumpleanosPorMes(mes);
  }

  @Patch('expediente/:expedienteId')
  @RequierePermiso('beneficiarios:editar')
  updateExpediente(
    @Param('expedienteId', ParseUUIDPipe) expedienteId: string,
    @Body() data: any,
  ) {
    return this.beneficiariosService.updateExpediente(expedienteId, data);
  }

  @Delete('expediente/:expedienteId')
  @RequierePermiso('beneficiarios:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteExpediente(@Param('expedienteId', ParseUUIDPipe) expedienteId: string) {
    return this.beneficiariosService.deleteExpediente(expedienteId);
  }

  // --- Dynamic :id routes come AFTER static routes ---

  @Get(':id')
  @RequierePermiso('beneficiarios:ver')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.beneficiariosService.findOne(id);
  }

  @Get(':id/estadisticas')
  @RequierePermiso('beneficiarios:ver')
  getEstadisticas(@Param('id', ParseUUIDPipe) id: string) {
    return this.beneficiariosService.getEstadisticas(id);
  }

  @Get(':id/expediente')
  @RequierePermiso('beneficiarios:ver')
  getExpedientes(@Param('id', ParseUUIDPipe) id: string) {
    return this.beneficiariosService.getExpedientes(id);
  }

  @Get(':id/mudanzas')
  @RequierePermiso('beneficiarios:ver')
  getMudanzas(@Param('id', ParseUUIDPipe) id: string) {
    return this.beneficiariosService.getMudanzas(id);
  }

  @Post(':id/mudanzas')
  @RequierePermiso('beneficiarios:editar')
  registrarMudanza(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: RegistrarMudanzaDto,
    @CurrentUser() usuario: { id: string; nombre: string },
  ) {
    return this.beneficiariosService.registrarMudanza(id, data, usuario);
  }

  @Patch(':id/mudanzas/:mudanzaId/finalizar')
  @RequierePermiso('beneficiarios:editar')
  finalizarMudanza(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('mudanzaId', ParseUUIDPipe) mudanzaId: string,
    @Body() data: FinalizarMudanzaDto,
    @CurrentUser() usuario: { id: string; nombre: string },
  ) {
    return this.beneficiariosService.finalizarMudanza(
      id,
      mudanzaId,
      data,
      usuario,
    );
  }

  @Post(':id/expediente')
  @RequierePermiso('beneficiarios:editar')
  addExpediente(@Param('id', ParseUUIDPipe) id: string, @Body() data: any) {
    return this.beneficiariosService.addExpediente(id, data);
  }

  @Patch(':id')
  @RequierePermiso('beneficiarios:editar')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBeneficiarioDto: UpdateBeneficiarioDto,
  ) {
    return this.beneficiariosService.update(id, updateBeneficiarioDto);
  }

  @Post(':id/asignar-clases')
  @RequierePermiso('beneficiarios:editar')
  asignarClases(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() asignarClaseDto: AsignarClaseDto,
  ) {
    return this.beneficiariosService.asignarClases(id, asignarClaseDto);
  }

  @Delete(':id/clases/:claseId')
  @RequierePermiso('beneficiarios:editar')
  @HttpCode(HttpStatus.NO_CONTENT)
  removerDeClase(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('claseId', ParseUUIDPipe) claseId: string,
  ) {
    return this.beneficiariosService.removerDeClase(id, claseId);
  }

  @Delete(':id')
  @RequierePermiso('beneficiarios:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.beneficiariosService.remove(id);
  }

  @Patch(':id/desactivar')
  @RequierePermiso('beneficiarios:editar')
  softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return this.beneficiariosService.softDelete(id);
  }
}
