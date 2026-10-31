import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DesembolsosService } from './desembolsos.service';
import { CreateDesembolsoDto } from './dto/create-desembolso.dto';
import { UpdateDesembolsoDto } from './dto/update-desembolso.dto';
import { FilterDesembolsoDto } from './dto/filter-desembolso.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermiso } from '../auth/decorators/permisos.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('desembolsos')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class DesembolsosController {
  constructor(private readonly desembolsosService: DesembolsosService) {}

  @Post()
  @RequierePermiso('desembolsos:crear')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateDesembolsoDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.desembolsosService.create(dto, user?.id);
  }

  @Get()
  @RequierePermiso('desembolsos:ver')
  findAll(@Query() filters: FilterDesembolsoDto) {
    return this.desembolsosService.findAll(filters);
  }

  // Autocompletar el nombre al escribir el código en el formulario
  @Get('beneficiario/codigo/:codigo')
  @RequierePermiso('desembolsos:crear')
  buscarBeneficiario(@Param('codigo') codigo: string) {
    return this.desembolsosService.buscarBeneficiario(codigo);
  }

  // Ayudas registradas de un beneficiario (para su carpeta)
  @Get('beneficiario/:beneficiarioId')
  @RequierePermiso('desembolsos:ver')
  findByBeneficiario(
    @Param('beneficiarioId', ParseUUIDPipe) beneficiarioId: string,
  ) {
    return this.desembolsosService.findByBeneficiario(beneficiarioId);
  }

  @Get(':id')
  @RequierePermiso('desembolsos:ver')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.desembolsosService.findOne(id);
  }

  @Patch(':id')
  @RequierePermiso('desembolsos:editar')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDesembolsoDto,
  ) {
    return this.desembolsosService.update(id, dto);
  }

  @Delete(':id')
  @RequierePermiso('desembolsos:eliminar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.desembolsosService.remove(id);
  }
}
