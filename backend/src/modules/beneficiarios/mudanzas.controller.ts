import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BeneficiariosService } from './beneficiarios.service';
import { FiltrarMudanzasDto } from './dto/beneficiario-mudanza.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermiso } from '../auth/decorators/permisos.decorator';

// Vista general de mudanzas de todos los beneficiarios. Registrar y finalizar
// siguen en /beneficiarios/:id/mudanzas.
@Controller('mudanzas')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class MudanzasController {
  constructor(private readonly beneficiariosService: BeneficiariosService) {}

  @Get()
  @RequierePermiso('mudanzas:ver')
  listar(@Query() filtros: FiltrarMudanzasDto) {
    return this.beneficiariosService.listarMudanzas(filtros);
  }
}
