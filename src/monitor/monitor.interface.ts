import { MonitorEntity } from './monitor.entity';

export interface MonitorRO {
  monitor: MonitorEntity;
}

export interface MonitorsRO {
  monitors: MonitorEntity[];
  monitorsCount: number;
}
