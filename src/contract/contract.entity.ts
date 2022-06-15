import { MintType } from 'src/collection/collection.types';
import { Net } from 'src/global.types';
import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Status } from './contract.types';

@Entity('contract')
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  net: Net;

  @Column()
  address: string;

  @Column({ nullable: true })
  mintType: MintType;

  @Column()
  verified: boolean;

  @Column()
  status: Status;

  @Column({ type: 'bigint' })
  createdAt: number;
}
