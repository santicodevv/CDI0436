import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Supervivencia } from './supervivencia.entity';

@Entity('encuentros_supervivencia')
@Index('IDX_ENCUENTROS_SUPERV_CURSO_FECHA', ['supervivencia', 'fecha'], {
  unique: true,
})
export class EncuentroSupervivencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Supervivencia, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supervivencia_id' })
  supervivencia: Supervivencia;

  @Column({ type: 'date' })
  fecha: string;
}
