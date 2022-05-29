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
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollectionEntity]),
    EventsModule,
    MonitorModule,
    WalletModule,
  ],
  providers: [CollectionService],
  controllers: [CollectionController],
  exports: [CollectionService],
})
export class CollectionModule implements NestModule {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public configure() {}
}
