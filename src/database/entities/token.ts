import { Column, Entity } from 'typeorm';
import { TemplateEntity } from './template.entity';

@Entity({ name: 'token' })
export class TokenEntity extends TemplateEntity {
  @Column('bytea')
  token: string;

  @Column('bytea')
  refreshToken: string;
}
