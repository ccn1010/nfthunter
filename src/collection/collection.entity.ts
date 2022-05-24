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

  @Column('json', { nullable: true })
  mintConfig: string;

  @Column({ nullable: true })
  ropstenContractAddress: string;

  @Column({ type: 'bigint' })
  createdAt: number;
}
