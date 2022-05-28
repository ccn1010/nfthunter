import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('collection')
export class CollectionEntity {
  @PrimaryColumn()
  contractAddress: string;

  @Column()
  mintType: string;

  @Column()
  compilerVersion: string;

  @Column()
  contractName: string;

  @Column('longtext')
  constructorArguments: string;

  @Column('longtext')
  abi: string;

  @Column('longtext')
  sourceCode: string;

  @Column('json')
  sourceCodes: {[key: string]: any}[];

  @Column('json')
  contractPathList: {[key: string]: any}[];

  @Column('json', { nullable: true })
  mintConfig: {[key: string]: any};

  @Column({ nullable: true })
  ropstenContractAddress: string;

  @Column({ type: 'bigint' })
  createdAt: number;
}
