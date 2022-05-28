import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionEntity } from './collection.entity';
import { CollectionService } from './collection.service';
import { Mint } from './mint';
import { ToggleMint } from './toggle.mint';
import { EventsModule } from 'src/events/events.module';
import { MonitorModule } from 'src/monitor/monitor.module';
import { ScheduleMint } from './schedule.mint';
import { Deployment } from './deployment';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionEntity]),
    EventsModule,
    MonitorModule,
  ],
  providers: [Mint, ToggleMint, ScheduleMint, Deployment, CollectionService],
  controllers: [CollectionController],
  exports: [CollectionService],
})
export class CollectionModule implements NestModule {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public configure() {}
}
