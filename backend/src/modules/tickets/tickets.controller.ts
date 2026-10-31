import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { TAMANO_MAXIMO_PDF, TicketsService } from './tickets.service';
import type { UsuarioTicket } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { FilterTicketDto } from './dto/filter-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../auth/guards/permisos.guard';
import { RequierePermiso } from '../auth/decorators/permisos.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tickets')
@UseGuards(JwtAuthGuard, PermisosGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @RequierePermiso('tickets:crear')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    // Un poco más que el máximo para que el servicio responda con un mensaje claro
    FileInterceptor('documento', {
      limits: { fileSize: TAMANO_MAXIMO_PDF + 1 },
    }),
  )
  create(
    @Body() dto: CreateTicketDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: UsuarioTicket,
  ) {
    return this.ticketsService.create(dto, user.id, file);
  }

  @Get('mios')
  @RequierePermiso('tickets:crear', 'tickets:gestionar')
  findMios(@CurrentUser() user: UsuarioTicket) {
    return this.ticketsService.findMios(user.id);
  }

  @Get()
  @RequierePermiso('tickets:gestionar')
  findAll(@Query() filters: FilterTicketDto) {
    return this.ticketsService.findAll(filters);
  }

  @Get(':id')
  @RequierePermiso('tickets:crear', 'tickets:gestionar')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UsuarioTicket,
  ) {
    return this.ticketsService.findOneVisible(id, user);
  }

  @Get(':id/documento')
  @RequierePermiso('tickets:crear', 'tickets:gestionar')
  async documento(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UsuarioTicket,
    @Res() res: Response,
  ) {
    const { ruta, nombre } = await this.ticketsService.getDocumento(id, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename*=UTF-8''${encodeURIComponent(nombre)}`,
    );
    res.sendFile(ruta);
  }

  @Patch(':id')
  @RequierePermiso('tickets:gestionar')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, dto);
  }

  @Delete(':id')
  @RequierePermiso('tickets:gestionar')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticketsService.remove(id);
  }
}
