import { IsDateString, IsOptional, IsString } from 'class-validator';

export class FilterDesembolsoDto {
  @IsString()
  @IsOptional()
  buscar?: string;

  @IsDateString()
  @IsOptional()
  desde?: string;

  @IsDateString()
  @IsOptional()
  hasta?: string;
}
