import { IsDateString, Matches } from 'class-validator';

export class ReportePaseListaDto {
  @Matches(/^[1-9]\d{3}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  fechaInicio: string;

  @Matches(/^[1-9]\d{3}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  fechaFin: string;
}
