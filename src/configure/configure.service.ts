import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigureEntity } from './configure.entity';
import { CreateConfigureDto } from './dto';

import { ConfigureRO, ConfiguresRO } from './configure.interface';

@Injectable()
export class ConfigureService {
  constructor(
    @InjectRepository(ConfigureEntity)
    private readonly configureRepository: Repository<ConfigureEntity>,
  ) {}

  async findAll(query): Promise<ConfiguresRO> {
    const qb = await this.configureRepository.createQueryBuilder('configure');

    qb.where('1 = 1');

    const configuresCount = await qb.getCount();

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const configures = await qb.getMany();

    return { configures, configuresCount };
  }

  async findOne(where): Promise<ConfigureRO> {
    const configure = await this.configureRepository.findOneBy(where);
    return { configure };
  }

  async create(configureData: Partial<CreateConfigureDto>): Promise<ConfigureEntity> {
    const configure = new ConfigureEntity();
    configure.id = configureData.id;
    configure.metadata = configureData.metadata;

    const newConfigure = await this.configureRepository.save(configure);

    return newConfigure;
  }

  async update(id: string, configureData: Partial<CreateConfigureDto>) {
    await this.configureRepository.update(id, configureData);
  }

  async clear(): Promise<void> {
    const ret = await this.configureRepository.clear();
    return ret;
  }
}
