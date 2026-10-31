import { EncuentroClub } from './modules/clubs/encuentro-club.entity';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Importar entidades
import { Usuario } from './modules/usuarios/usuario.entity';
import { Tutor } from './modules/tutores/tutor.entity';
import { Horario } from './modules/horarios/horario.entity';
import { Clase } from './modules/clases/clase.entity';
import { Asistencia } from './modules/asistencias/asistencia.entity';
import { Reporte } from './modules/reportes/reporte.entity';
import { Beneficiario } from './modules/beneficiarios/beneficiario.entity';
import { BeneficiarioExpediente } from './modules/beneficiarios/beneficiario-expediente.entity';
import { Rol } from './modules/roles/entities/rol.entity';
import { Permiso } from './modules/roles/entities/permiso.entity';
import { Supervivencia } from './modules/supervivencias/supervivencia.entity';
import { EncuentroSupervivencia } from './modules/supervivencias/encuentro-supervivencia.entity';
import { AsistenciaSupervivencia } from './modules/supervivencias/asistencia-supervivencia.entity';
import { FotoAsistenciaSupervivencia } from './modules/supervivencias/foto-asistencia-supervivencia.entity';
import { Club } from './modules/clubs/club.entity';
import { AsistenciaClub } from './modules/clubs/asistencia-club.entity';
import { FotoAsistenciaClub } from './modules/clubs/foto-asistencia-club.entity';
import { MenuNutricion } from './modules/nutricion/menu-nutricion.entity';
import { PeriodoMerito } from './modules/merito/periodo-merito.entity';
import { NotaMerito } from './modules/merito/nota-merito.entity';
import { DocumentoUsuario } from './modules/usuarios/documento-usuario.entity';
import { Trabajador } from './modules/asistencia-personal/trabajador.entity';
import { AsistenciaPersonal } from './modules/asistencia-personal/asistencia-personal.entity';
import { BonoRegalo } from './modules/bonos/bono-regalo.entity';

// Importar módulos
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { TutoresModule } from './modules/tutores/tutores.module';
import { HorariosModule } from './modules/horarios/horarios.module';
import { BeneficiariosModule } from './modules/beneficiarios/beneficiarios.module';
import { ClasesModule } from './modules/clases/clases.module';
import { AsistenciasModule } from './modules/asistencias/asistencias.module';
import { AyudasModule } from './modules/ayudas/ayudas.module';
import { RolesModule } from './modules/roles/roles.module';
import { SupervivenciasModule } from './modules/supervivencias/supervivencias.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { NutricionModule } from './modules/nutricion/nutricion.module';
import { MeritoModule } from './modules/merito/merito.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { AsistenciaPersonalModule } from './modules/asistencia-personal/asistencia-personal.module';
import { BonosModule } from './modules/bonos/bonos.module';
import { DesembolsosModule } from './modules/desembolsos/desembolsos.module';
import { Desembolso } from './modules/desembolsos/desembolso.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get('DATABASE_URL');
        const isLocalDb = dbUrl?.includes('localhost');
        const synchronize =
          configService.get('NODE_ENV') !== 'production' &&
          configService.get('DB_SYNCHRONIZE') === 'true';
        return {
          type: 'postgres' as const,
          url: dbUrl,
          entities: [
            Usuario,
            Tutor,
            Horario,
            Beneficiario,
            BeneficiarioExpediente,
            Clase,
            Asistencia,
            Reporte,
            Rol,
            Permiso,
            Supervivencia,
            EncuentroSupervivencia,
            AsistenciaSupervivencia,
            FotoAsistenciaSupervivencia,
            Club,
            EncuentroClub,
            AsistenciaClub,
            FotoAsistenciaClub,
            MenuNutricion,
            PeriodoMerito,
            NotaMerito,
            DocumentoUsuario,
            Trabajador,
            AsistenciaPersonal,
            BonoRegalo,
            Desembolso,
          ],
          // Keep schema synchronization disabled unless explicitly enabled outside production.
          // Usa los comandos del package.json para gestionar migraciones:
          //   npm run migration:generate -- src/migrations/Nombre
          //   npm run migration:run
          //   npm run migration:revert
          synchronize,
          migrationsTableName: 'migrations_typeorm',
          migrations: ['dist/src/migrations/*.{ts,js}'],
          ssl: isLocalDb ? false : { rejectUnauthorized: false },
          logging: ['error', 'warn'],
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),

    // Módulos de la aplicación
    RolesModule, // Debe ir primero para que los permisos se creen
    AuthModule,
    UsuariosModule,
    TutoresModule,
    HorariosModule,
    BeneficiariosModule,
    ClasesModule,
    AsistenciasModule,
    AyudasModule,
    SupervivenciasModule,
    ClubsModule,
    NutricionModule,
    MeritoModule,
    ReportesModule,
    AsistenciaPersonalModule,
    BonosModule,
    DesembolsosModule,
  ],
})
export class AppModule {}
