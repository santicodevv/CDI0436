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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BonosService } from './bonos.service';
import {
  CreateBonosRegaloLoteDto,
  MarcarEntregadoDto,
} from './dto/create-bono-regalo.dto';
import { FilterBonoRegaloDto } from './dto/filter-bono-regalo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermiso } from '../auth/decorators/permisos.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('bonos')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class BonosController {
  constructor(private readonly bonosService: BonosService) {}

  @Post('regalos')
  @RequierePermiso('bonos:generar')
  @HttpCode(HttpStatus.CREATED)
  crearLote(@Body() dto: CreateBonosRegaloLoteDto, @CurrentUser() user: any) {
    return this.bonosService.crearLote(dto, user.id);
  }

  @Get('regalos')
  @RequierePermiso('bonos:ver')
  findAll(@Query() filters: FilterBonoRegaloDto) {
    return this.bonosService.findAll(filters);
  }

  @Get('regalos/estadisticas')
  @RequierePermiso('bonos:ver')
  estadisticas(@Query('mes') mes?: string) {
    return this.bonosService.estadisticas(mes);
  }

  @Get('regalos/meses')
  @RequierePermiso('bonos:ver')
  findMeses() {
    return this.bonosService.findMeses();
  }

  @Get('regalos/:id')
  @RequierePermiso('bonos:ver')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bonosService.findOne(id);
  }

  @Patch('regalos/:id/entrega')
  @RequierePermiso('bonos:generar')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: diskStorage({
        destination: './uploads/bonos',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `entrega-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(new Error('Solo se permiten imágenes'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  marcarEntregado(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: MarcarEntregadoDto,
    @CurrentUser() user: any,
  ) {
    const dto: MarcarEntregadoDto = {
      foto_entrega: file
        ? `/uploads/bonos/${file.filename}`
        : body.foto_entrega,
    };
    return this.bonosService.marcarEntregado(id, dto, user.id);
  }

  @Delete('regalos/:id')
  @RequierePermiso('bonos:generar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bonosService.remove(id);
  }
}
