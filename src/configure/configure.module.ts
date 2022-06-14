import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigureController } from './configure.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigureEntity } from './configure.entity';
import { ConfigureService } from './configure.service';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([ConfigureEntity]), EventsModule],
  providers: [ConfigureService],
  controllers: [ConfigureController],
  exports: [ConfigureService],
})
export class ConfigureModule implements NestModule {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public configure() {}
}
