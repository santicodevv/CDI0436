import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDesembolsoDto {
  @IsDateString()
  fecha: string;

  @IsString()
  @IsNotEmpty()
  detalle: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo_beneficiario: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  referencia?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  cuenta?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto: number;
}
