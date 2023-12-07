import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {StatisticsService} from '../statistics/statistics.service';
import {MarketStatisticsService} from '../statistics/market.statistics.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly marketStatisticsService: MarketStatisticsService,
  ) {}

  @Cron('*/30 * * * *')
  handleCron() {
    this.logger.log('Called when the current minutes is 30');
    this.statisticsService.getTokenInfo('ELF');
    this.marketStatisticsService.getMarketInfoWithCache('ELF');
  }
}
