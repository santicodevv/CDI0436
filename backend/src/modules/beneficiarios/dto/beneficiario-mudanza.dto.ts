import { Transform } from 'class-transformer';
import {
  Equals,
  IsDateString,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ResultadoMudanza } from '../beneficiario-mudanza.entity';

function recortar({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim() : value;
}

export class RegistrarMudanzaDto {
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  direccion: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  telefono: string;

  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cuidador: string;
}

export class FinalizarMudanzaDto {
  @IsEnum(ResultadoMudanza)
  resultado: ResultadoMudanza;

  @ValidateIf(
    (dto: FinalizarMudanzaDto) => dto.resultado === ResultadoMudanza.TRASLADO,
  )
  @Transform(recortar)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  centro_receptor?: string;

  @ValidateIf(
    (dto: FinalizarMudanzaDto) => dto.resultado === ResultadoMudanza.TRASLADO,
  )
  @Equals(true, {
    message: 'Debes confirmar la recepción del centro de destino',
  })
  recepcion_confirmada?: boolean;
}

export const ESTADOS_MUDANZA = ['pendiente', 'traslado', 'salida'] as const;
export type EstadoMudanza = (typeof ESTADOS_MUDANZA)[number];

export class FiltrarMudanzasDto {
  @IsOptional()
  @IsIn(ESTADOS_MUDANZA)
  estado?: EstadoMudanza;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  buscar?: string;

  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  pagina?: string;

  @IsOptional()
  @IsNumberString({ no_symbols: true })
  limite?: string;
}
