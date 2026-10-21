import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupervivenciasService } from './supervivencias.service';
import { SupervivenciasController } from './supervivencias.controller';
import { Supervivencia } from './supervivencia.entity';
import { EncuentroSupervivencia } from './encuentro-supervivencia.entity';
import { AsistenciaSupervivencia } from './asistencia-supervivencia.entity';
import { FotoAsistenciaSupervivencia } from './foto-asistencia-supervivencia.entity';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { Tutor } from '../tutores/tutor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supervivencia,
      EncuentroSupervivencia,
      AsistenciaSupervivencia,
      FotoAsistenciaSupervivencia,
      Beneficiario,
      Tutor,
    ]),
  ],
  controllers: [SupervivenciasController],
  providers: [SupervivenciasService],
  exports: [SupervivenciasService, TypeOrmModule],
})
export class SupervivenciasModule {}
