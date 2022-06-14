import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ContractController } from './contract.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractEntity } from './contract.entity';
import { ContractService } from './contract.service';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([ContractEntity]), EventsModule],
  providers: [ContractService],
  controllers: [ContractController],
  exports: [ContractService],
})
export class ContractModule implements NestModule {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public configure() {}
}
