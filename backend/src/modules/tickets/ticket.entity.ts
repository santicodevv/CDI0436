import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Generated,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';

export enum TipoTicket {
  MEJORA = 'mejora',
  ERROR = 'error',
  OTRO = 'otro',
}

export enum PrioridadTicket {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
}

export enum EstadoTicket {
  ABIERTO = 'abierto',
  EN_PROGRESO = 'en_progreso',
  COMPLETADO = 'completado',
  RECHAZADO = 'rechazado',
}

// Solicitud de cambio o reporte de problema en la plataforma.
@Entity('tickets')
@Index('IDX_TICKETS_ESTADO', ['estado'])
@Index('IDX_TICKETS_CREADO_POR', ['creado_por'])
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Número legible para referirse al ticket (#1, #2, ...)
  @Column({ unique: true })
  @Generated('increment')
  numero: number;

  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'varchar', length: 20, default: TipoTicket.MEJORA })
  tipo: TipoTicket;

  @Column({ type: 'varchar', length: 20, default: PrioridadTicket.MEDIA })
  prioridad: PrioridadTicket;

  @Column({ type: 'varchar', length: 20, default: EstadoTicket.ABIERTO })
  estado: EstadoTicket;

  // Nota del administrador para quien abrió el ticket
  @Column({ type: 'text', nullable: true })
  respuesta: string | null;

  // Ruta en disco del PDF; nunca se expone, se descarga por el endpoint autenticado
  @Column({ type: 'varchar', length: 500, nullable: true, select: false })
  documento_path: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  documento_nombre: string | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creado_por_id' })
  creado_por: Usuario | null;

  @Column({ type: 'timestamp', nullable: true })
  cerrado_en: Date | null;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}
