import { Transform } from 'class-transformer';
import {
  Equals,
  IsEnum,
  IsNotEmpty,
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
