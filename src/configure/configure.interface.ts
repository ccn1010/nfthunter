import { ConfigureEntity } from './configure.entity';

export interface ConfigureRO {
  configure: ConfigureEntity;
}

export interface ConfiguresRO {
  configures: ConfigureEntity[];
  configuresCount: number;
}
