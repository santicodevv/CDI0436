import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class UpdateBonoRegaloDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsOptional()
  beneficiario_nombre?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  padre_nombre?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  cedula?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  monto?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  mes?: string;

  @IsString()
  @IsOptional()
  expira?: string;
}
