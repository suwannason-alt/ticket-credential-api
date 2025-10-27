import {
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export class TemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => "CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'",
  })
  createdAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => "CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Bangkok'",
  })
  updatedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  archivedBy: string;
}
