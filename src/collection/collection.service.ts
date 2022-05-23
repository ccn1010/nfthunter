import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionEntity } from './collection.entity';
import { CreateCollectionDto } from './dto';

import { CollectionRO, CollectionsRO } from './collection.interface';

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(CollectionEntity)
    private readonly collectionRepository: Repository<CollectionEntity>,
  ) {}

  async findAll(query): Promise<CollectionsRO> {
    const qb = await this.collectionRepository.createQueryBuilder('collection');

    qb.where('1 = 1');

    if ('symbol' in query) {
      qb.andWhere('collection.symbol = :symbol', { symbol: query.symbol });
    }

    if ('tag' in query) {
      qb.andWhere('collection.tag = :tag', { symbol: query.symbol });
    }

    const collectionsCount = await qb.getCount();

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const collections = await qb.getMany();

    return { collections, collectionsCount };
  }

  async findOne(where): Promise<CollectionRO> {
    const collection = await this.collectionRepository.findOneByOrFail(where);
    return { collection };
  }

  async create(
    collectionData: Partial<CreateCollectionDto>,
  ): Promise<CollectionEntity> {
    const collection = new CollectionEntity();
    collection.contractAddress = collectionData.contractAddress;
    collection.contractName = collectionData.contractName;
    collection.compilerVersion = collectionData.compilerVersion;
    collection.constructorArguments = collectionData.constructorArguments;
    collection.abi = collectionData.abi;
    collection.sourceCode = collectionData.sourceCode;
    collection.createdAt = Date.now();

    const newCollection = await this.collectionRepository.save(collection);

    return newCollection;
  }

  async update(address: string, collectionData: Partial<CreateCollectionDto>) {
    await this.collectionRepository.update(address, collectionData);
  }

  async clear(): Promise<void> {
    const ret = await this.collectionRepository.clear();
    return ret;
  }
}
