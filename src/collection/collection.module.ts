import {
  Module,
  NestModule,
} from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionEntity } from './collection.entity';
import { CollectionService } from './collection.service';
import { EventsModule } from 'src/events/events.module';
import { MonitorModule } from 'src/monitor/monitor.module';
import { ConfigureModule } from 'src/configure/configure.module';
import { ContractModule } from 'src/contract/contract.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionEntity]),
    EventsModule,
    MonitorModule,
    ConfigureModule,
    ContractModule,
  ],
  providers: [CollectionService],
  controllers: [CollectionController],
  exports: [CollectionService],
})
export class CollectionModule implements NestModule {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public configure() {}
}
