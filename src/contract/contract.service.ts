import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractEntity } from './contract.entity';
import { CreateContractDto } from './dto';

import { ContractRO, ContractsRO } from './contract.interface';
import { Deployment } from 'src/collection/deployment';
import { Net } from 'src/global.types';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(ContractEntity)
    private readonly contractRepository: Repository<ContractEntity>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAll(query): Promise<ContractsRO> {
    const qb = await this.contractRepository.createQueryBuilder('contract');

    qb.where('1 = 1');

    const contractsCount = await qb.getCount();

    if ('createdAt' in query) {
      qb.andWhere('contract.createdAt >= :createdAt', { createdAt: query.createdAt });
    }

    if ('net' in query) {
      qb.andWhere('contract.net = :net', { net: query.net });
    }

    if ('verified' in query) {
      qb.andWhere('contract.verified = :verified', { verified: query.verified });
    }

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
    return await this.contractRepository.update(id, contractData);
  }

  async clear(): Promise<void> {
    const ret = await this.contractRepository.clear();
    return ret;
  }

  pullData() {
    let next;
    return (() => {
      setInterval(async ()=>{
        const contractsRO = await this.findAll({
          createdAt: Date.now() - 1000 * 60 * 60 * 24,
          net: Net.Mainnet,
          verified: false,
        });
        const contracts = contractsRO.contracts;
        // console.log('contracts.length', contracts.length, next)
        for(let i=0; i < contracts.length; i++) {
          const contract = contracts[i];
          if(!next){
            next = contract;
          }

          if(next.id === contract.id){
            next = contracts[i+1];
            this.updateSourceCode(contract);
            return;
          }
        }
        next = undefined;
      }, 1000*5);
    })();
  }

  async updateSourceCode(contract) {
    let codes
    try{
      codes = await Deployment.getContractSourceCodes(contract.address);
    }catch(e){}
    if(!codes){
      return;
    }
    const codeData = codes[0];
    // console.log('codeData', codeData);
    await this.update(contract.id, {
      verified: true,
      name: codeData.ContractName,
    });
    this.eventsGateway.send('sniff-refresh', null);
  }
}
