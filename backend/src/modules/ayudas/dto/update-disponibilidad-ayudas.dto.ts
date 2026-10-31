import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateDisponibilidadAyudasDto {
  @IsBoolean({ message: 'habilitada debe ser verdadero o falso' })
  habilitada: boolean;

  // El motivo solo es obligatorio al cerrar las solicitudes.
  @ValidateIf((dto: UpdateDisponibilidadAyudasDto) => dto.habilitada === false)
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar el motivo del cierre' })
  @MaxLength(500, { message: 'El motivo no puede superar 500 caracteres' })
  motivo?: string;
}
