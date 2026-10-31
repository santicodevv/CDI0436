import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Beneficiario } from '../beneficiarios/beneficiario.entity';
import { Usuario } from '../usuarios/usuario.entity';

// Ayuda económica entregada a un beneficiario (registro contable).
// Se guarda una copia del código y nombre del beneficiario para que el
// registro conserve su historial aunque el beneficiario se elimine.
@Entity('desembolsos')
@Index('IDX_DESEMBOLSOS_BENEFICIARIO', ['beneficiario'])
@Index('IDX_DESEMBOLSOS_FECHA', ['fecha'])
export class Desembolso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'text' })
  detalle: string;

  @Column({ length: 20 })
  codigo_beneficiario: string;

  @Column({ length: 200 })
  nombre_beneficiario: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cuenta: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? null : Number(value)),
    },
  })
  monto: number;

  @ManyToOne(() => Beneficiario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'beneficiario_id' })
  beneficiario: Beneficiario | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'registrado_por_id' })
  registrado_por: Usuario | null;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}
