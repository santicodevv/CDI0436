import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoTicket, PrioridadTicket } from '../ticket.entity';

export class UpdateTicketDto {
  @IsEnum(EstadoTicket)
  @IsOptional()
  estado?: EstadoTicket;

  @IsEnum(PrioridadTicket)
  @IsOptional()
  prioridad?: PrioridadTicket;

  @IsString()
  @IsOptional()
  respuesta?: string;
}
