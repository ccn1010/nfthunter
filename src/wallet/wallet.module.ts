import {
  Module,
  NestModule,
} from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletEntity } from './wallet.entity';
import { WalletService } from './wallet.service';
import { EventsModule } from 'src/events/events.module';
import { MonitorModule } from 'src/monitor/monitor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletEntity]),
    EventsModule,
    MonitorModule,
  ],
  providers: [WalletService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule implements NestModule {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public configure() {}
}
