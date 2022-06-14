import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractEntity } from './contract.entity';
import { CreateContractDto } from './dto';

import { ContractRO, ContractsRO } from './contract.interface';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepository: Repository<ContractEntity>,
  ) {}

  async findAll(query): Promise<ContractsRO> {
    const qb = await this.contractRepository.createQueryBuilder('contract');

    qb.where('1 = 1');

    const contractsCount = await qb.getCount();

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    qb.orderBy('createdAt', 'DESC');
    const contracts = await qb.getMany();

    return { contracts, contractsCount };
  }

  async findOne(where): Promise<ContractRO> {
    const contract = await this.contractRepository.findOneByOrFail(where);
    return { contract };
  }

  async create(contractData: Partial<CreateContractDto>): Promise<ContractEntity> {
    const contract = new ContractEntity();
    contract.net = contractData.net;
    contract.address = contractData.address;
    contract.verified = contractData.verified;
    contract.mintType = contractData.mintType;
    contract.status = contractData.status;
    contract.createdAt = Date.now();

    const newContract = await this.contractRepository.save(contract);

    return newContract;
  }

  async update(id: string, contractData: Partial<CreateContractDto>) {
    await this.contractRepository.update(id, contractData);
  }

  async clear(): Promise<void> {
    const ret = await this.contractRepository.clear();
    return ret;
  }
}
