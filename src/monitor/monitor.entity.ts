import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('monitor')
export class MonitorEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  net: string;

  @Column()
  contractAddress: string;

  @Column()
  step: string;

  @Column('json', { nullable: true })
  log: { [key: string]: any };

  @Column({ type: 'bigint' })
  createdAt: number;
}
