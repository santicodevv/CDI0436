import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciasService } from './asistencias.service';
import { AsistenciasController } from './asistencias.controller';
import { Asistencia } from './asistencia.entity';
import { FotoAsistencia } from './foto-asistencia.entity';
import { Clase } from '../clases/clase.entity';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { Tutor } from '../tutores/tutor.entity';
import { PaseListaTutorService } from './pase-lista-tutor.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asistencia,
      FotoAsistencia,
      Clase,
      Beneficiario,
      Tutor,
    ]),
  ],
  controllers: [AsistenciasController],
  providers: [AsistenciasService, PaseListaTutorService],
  exports: [AsistenciasService, TypeOrmModule],
})
export class AsistenciasModule {}
