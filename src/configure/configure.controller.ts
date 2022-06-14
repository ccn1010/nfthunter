import { Get, Post, Body, Put, Query, Param, Controller } from '@nestjs/common';
import { ConfigureService } from './configure.service';
import { ConfiguresRO, ConfigureRO } from './configure.interface';
import { EventsGateway } from 'src/events/events.gateway';
import { Net } from 'src/global.types';

@Controller('configures')
export class ConfigureController {
  constructor(
    private readonly configureService: ConfigureService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Get(':id')
  async findByAddress(@Param('id') id): Promise<ConfiguresRO> {
    return await this.configureService.findAll({ contractAddress: id });
  }

  @Put(':id')
  async put(@Param('id') id, @Body() body) {
    this.configureService.update(id, body);
  }

}
