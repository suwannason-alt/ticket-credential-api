import {
  Column,
  CreateDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export class TemplateEntity {
  @PrimaryColumn('uuid')
  uuid: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  archivedBy: string;
}
