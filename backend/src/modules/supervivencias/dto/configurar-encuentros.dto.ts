import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  Matches,
} from 'class-validator';

export class MesEncuentrosDto {
  @Matches(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/)
  mes: string;
}

export class ConfigurarEncuentrosDto extends MesEncuentrosDto {
  @IsArray()
  @ArrayMaxSize(31)
  @ArrayUnique()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { each: true })
  @IsDateString({ strict: true }, { each: true })
  fechas: string[];
}
