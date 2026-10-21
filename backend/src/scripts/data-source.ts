import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Entidades (mismo listado que en app.module.ts)
import { Usuario } from '../modules/usuarios/usuario.entity';
import { Tutor } from '../modules/tutores/tutor.entity';
import { Horario } from '../modules/horarios/horario.entity';
import { Clase } from '../modules/clases/clase.entity';
import { Asistencia } from '../modules/asistencias/asistencia.entity';
import { FotoAsistencia } from '../modules/asistencias/foto-asistencia.entity';
import { Reporte } from '../modules/reportes/reporte.entity';
import { Beneficiario } from '../modules/beneficiarios/beneficiario.entity';
import { BeneficiarioExpediente } from '../modules/beneficiarios/beneficiario-expediente.entity';
import { Rol } from '../modules/roles/entities/rol.entity';
import { Permiso } from '../modules/roles/entities/permiso.entity';
import { Supervivencia } from '../modules/supervivencias/supervivencia.entity';
import { EncuentroSupervivencia } from '../modules/supervivencias/encuentro-supervivencia.entity';
import { AsistenciaSupervivencia } from '../modules/supervivencias/asistencia-supervivencia.entity';
import { FotoAsistenciaSupervivencia } from '../modules/supervivencias/foto-asistencia-supervivencia.entity';
import { Club } from '../modules/clubs/club.entity';
import { AsistenciaClub } from '../modules/clubs/asistencia-club.entity';
import { FotoAsistenciaClub } from '../modules/clubs/foto-asistencia-club.entity';
import { MenuNutricion } from '../modules/nutricion/menu-nutricion.entity';
import { PeriodoMerito } from '../modules/merito/periodo-merito.entity';
import { NotaMerito } from '../modules/merito/nota-merito.entity';
import { DocumentoUsuario } from '../modules/usuarios/documento-usuario.entity';
import { Trabajador } from '../modules/asistencia-personal/trabajador.entity';
import { AsistenciaPersonal } from '../modules/asistencia-personal/asistencia-personal.entity';
import { BonoRegalo } from '../modules/bonos/bono-regalo.entity';
import { Ayuda } from '../modules/ayudas/ayuda.entity';
import { ComentarioAyuda } from '../modules/ayudas/comentario-ayuda.entity';

const isLocalDb = process.env.DATABASE_URL?.includes('localhost');

const options: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: isLocalDb ? false : { rejectUnauthorized: false },
  entities: [
    Usuario,
    Tutor,
    Horario,
    Clase,
    Asistencia,
    FotoAsistencia,
    Reporte,
    Beneficiario,
    BeneficiarioExpediente,
    Rol,
    Permiso,
    Supervivencia,
    EncuentroSupervivencia,
    AsistenciaSupervivencia,
    FotoAsistenciaSupervivencia,
    Club,
    AsistenciaClub,
    FotoAsistenciaClub,
    MenuNutricion,
    PeriodoMerito,
    NotaMerito,
    DocumentoUsuario,
    Trabajador,
    AsistenciaPersonal,
    BonoRegalo,
    Ayuda,
    ComentarioAyuda,
  ],
  migrations: [path.resolve(__dirname, '../migrations/*.{ts,js}')],
  migrationsTableName: 'migrations_typeorm',
};

export const AppDataSource = new DataSource(options);
