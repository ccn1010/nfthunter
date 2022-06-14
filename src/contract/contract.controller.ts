import { Get, Post, Body, Put, Query, Param, Controller } from '@nestjs/common';
import { ContractService } from './contract.service';
import { ContractsRO, ContractRO } from './contract.interface';
import { EventsGateway } from 'src/events/events.gateway';

@Controller('contracts')
export class ContractController {
  constructor(
    private readonly contractService: ContractService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Get(':id')
  async findByAddress(@Param('id') id): Promise<ContractsRO> {
    return await this.contractService.findAll({ contractAddress: id });
  }

  @Put(':id')
  async put(@Param('id') id, @Body() body) {
    this.contractService.update(id, body);
  }
  
}
