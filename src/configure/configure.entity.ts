import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('configure')
export class ConfigureEntity {
  @PrimaryColumn()
  id: string;

  @Column('json', { nullable: true })
  metadata: { [key: string]: any };

}
