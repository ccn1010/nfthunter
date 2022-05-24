import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitorEntity } from './monitor.entity';
import { CreateMonitorDto } from './dto';

import { MonitorRO, MonitorsRO } from './monitor.interface';

@Injectable()
export class MonitorService {
  constructor(
    @InjectRepository(MonitorEntity)
    private readonly monitorRepository: Repository<MonitorEntity>,
  ) {}

  async findAll(query): Promise<MonitorsRO> {
    const qb = await this.monitorRepository.createQueryBuilder('monitor');

    qb.where('1 = 1');

    if ('contractAddress' in query) {
      qb.andWhere('monitor.contractAddress = :contractAddress', {
        contractAddress: query.contractAddress,
      });
    }

    const monitorsCount = await qb.getCount();

    if ('limit' in query) {
      qb.limit(query.limit);
    }

    if ('offset' in query) {
      qb.offset(query.offset);
    }

    const monitors = await qb.getMany();

    return { monitors, monitorsCount };
  }

  async findOne(where): Promise<MonitorRO> {
    const monitor = await this.monitorRepository.findOneByOrFail(where);
    return { monitor };
  }

  async create(monitorData: Partial<CreateMonitorDto>): Promise<MonitorEntity> {
    const monitor = new MonitorEntity();
    monitor.net = monitorData.net;
    monitor.contractAddress = monitorData.contractAddress;
    monitor.step = monitorData.step;
    monitor.log = monitorData.log;
    monitor.createdAt = Date.now();

    const newMonitor = await this.monitorRepository.save(monitor);

    return newMonitor;
  }

  async update(address: string, monitorData: Partial<CreateMonitorDto>) {
    await this.monitorRepository.update(address, monitorData);
  }

  async clear(): Promise<void> {
    const ret = await this.monitorRepository.clear();
    return ret;
  }
}
