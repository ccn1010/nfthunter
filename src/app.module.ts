import { Module, OnModuleInit } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionModule } from './collection/collection.module';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { MonitorModule } from './monitor/monitor.module';
import { WalletModule } from './wallet/wallet.module';
import { ConfigureModule } from './configure/configure.module';
import { ContractModule } from './contract/contract.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'nfthunter123.',
      database: 'nfthunter',
      autoLoadEntities: true,
      synchronize: true,
      // logging: ["error"],
    }),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    EventsModule,
    CollectionModule,
    MonitorModule,
    ConfigureModule,
    ContractModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    // do something
  }
}
