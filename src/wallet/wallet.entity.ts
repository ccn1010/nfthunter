import { Entity, Column, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Net } from '../global.types';

@Entity('wallet')
export class WalletEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  privateKey: string;

  @Column()
  address: string;

  @Column({
    type: 'enum',
    enum: Net,
  })
  net: string;
}
