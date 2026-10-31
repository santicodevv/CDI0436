import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoTicket } from '../ticket.entity';

export class FilterTicketDto {
  @IsEnum(EstadoTicket)
  @IsOptional()
  estado?: EstadoTicket;

  @IsString()
  @IsOptional()
  buscar?: string;
}
