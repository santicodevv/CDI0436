import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Desembolso } from './desembolso.entity';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { DesembolsosService } from './desembolsos.service';
import { DesembolsosController } from './desembolsos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Desembolso, Beneficiario])],
  controllers: [DesembolsosController],
  providers: [DesembolsosService],
  exports: [DesembolsosService],
})
export class DesembolsosModule {}
