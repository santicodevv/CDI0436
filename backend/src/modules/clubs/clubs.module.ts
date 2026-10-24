import { EncuentroClub } from './encuentro-club.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';
import { Club } from './club.entity';
import { AsistenciaClub } from './asistencia-club.entity';
import { FotoAsistenciaClub } from './foto-asistencia-club.entity';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { Tutor } from '../tutores/tutor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Club,
      EncuentroClub,
      AsistenciaClub,
      FotoAsistenciaClub,
      Beneficiario,
      Tutor,
    ]),
  ],
  controllers: [ClubsController],
  providers: [ClubsService],
  exports: [ClubsService, TypeOrmModule],
})
export class ClubsModule {}
