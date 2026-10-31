import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

// Fila única (id = 1) que controla si el formulario público de ayudas acepta solicitudes.
export const CONFIGURACION_AYUDAS_ID = 1;

@Entity('configuracion_ayudas')
export class ConfiguracionAyudas {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ default: true })
  habilitada: boolean;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  actualizado_por: string | null;

  @UpdateDateColumn()
  actualizado_en: Date;
}
