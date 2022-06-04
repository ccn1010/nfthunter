import { Entity, Column, PrimaryColumn } from 'typeorm';
import { MintType } from './collection.types';

@Entity('collection')
export class CollectionEntity {
  @PrimaryColumn()
  contractAddress: string;

  @Column({
    type: 'enum',
    enum: MintType,
  })
  mintType: string;

  @Column()
  compilerVersion: string;

  @Column()
  contractName: string;

  @Column('longtext')
  constructorArguments: string;

  @Column('longtext')
  abi: string;

  @Column('json')
  contractPathList: {[key: string]: any}[];

  @Column('json', { nullable: true })
  profile: {[key: string]: any};

  @Column('json', { nullable: true })
  mintConfig: {[key: string]: any};

  @Column({ nullable: true })
  ropstenContractAddress: string;

  @Column({ nullable: true })
  ganacheContractAddress: string;

  @Column({ type: 'bigint' })
  createdAt: number;
}
