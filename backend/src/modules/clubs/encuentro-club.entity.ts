import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Club } from './club.entity';

@Entity('encuentros_club')
@Index('IDX_ENCUENTROS_CLUB_CURSO_FECHA', ['club', 'fecha'], {
  unique: true,
})
export class EncuentroClub {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Club, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @Column({ type: 'date' })
  fecha: string;
}
