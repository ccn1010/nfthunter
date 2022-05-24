import { Get, Post, Body, Put, Query, Param, Controller } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { MonitorsRO, MonitorRO } from './monitor.interface';
import { EventsGateway } from 'src/events/events.gateway';

@Controller('monitors')
export class MonitorController {
  constructor(
    private readonly monitorService: MonitorService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Get(':address')
  async findByAddress(@Param('address') address): Promise<MonitorsRO> {
    return await this.monitorService.findAll({ contractAddress: address });
  }

  @Put(':address')
  async put(@Param('address') address, @Body() body) {
    this.monitorService.update(address, body);
  }
}
