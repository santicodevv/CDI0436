import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Beneficiario } from './beneficiario.entity';

export enum ResultadoMudanza {
  TRASLADO = 'traslado',
  SALIDA = 'salida',
}

@Entity('beneficiario_mudanzas')
@Check('CHK_MUDANZAS_RESULTADO', `"resultado" IN ('traslado', 'salida')`)
@Index('IDX_MUDANZAS_BENEFICIARIO_FECHA', ['beneficiario_id', 'registrado_en'])
@Index('IDX_MUDANZA_PENDIENTE', ['beneficiario_id'], {
  unique: true,
  where: '"resultado" IS NULL',
})
export class BeneficiarioMudanza {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  beneficiario_id: string;

  @ManyToOne(() => Beneficiario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'beneficiario_id' })
  beneficiario: Beneficiario;

  @Column('text')
  direccion: string;

  @Column({ length: 20 })
  telefono: string;

  @Column({ length: 100 })
  cuidador: string;

  @Column('varchar', { length: 10, nullable: true })
  resultado: ResultadoMudanza | null;

  @Column('varchar', { length: 150, nullable: true })
  centro_receptor: string | null;

  @Column('uuid')
  registrado_por_id: string;

  @Column('text')
  registrado_por: string;

  @CreateDateColumn({ type: 'timestamptz' })
  registrado_en: Date;

  @Column('uuid', { nullable: true })
  finalizado_por_id: string | null;

  @Column('text', { nullable: true })
  finalizado_por: string | null;

  @Column('timestamptz', { nullable: true })
  finalizado_en: Date | null;
}
