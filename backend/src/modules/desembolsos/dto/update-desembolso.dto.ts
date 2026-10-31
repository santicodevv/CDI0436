import { PartialType } from '@nestjs/mapped-types';
import { CreateDesembolsoDto } from './create-desembolso.dto';

export class UpdateDesembolsoDto extends PartialType(CreateDesembolsoDto) {}
