import { ContractEntity } from './contract.entity';

export interface ContractRO {
  contract: ContractEntity;
}

export interface ContractsRO {
  contracts: ContractEntity[];
  contractsCount: number;
}
