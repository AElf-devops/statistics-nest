import {Controller, Get, Param, Query} from '@nestjs/common';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
  ) {}

  @Get('token')
  async getTokenInfo(@Query('symbol') symbol: string): Promise<string> {
    return this.statisticsService.getTokenInfo(symbol);
    // return 'this.statisticsService.getTokenInfo(symbol)';
  }
}
