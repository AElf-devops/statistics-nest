import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import {HttpModule} from '@nestjs/axios';
import {AelfWeb3Service} from '../web3/aelf.web3.service';
import {MarketStatisticsService} from './market.statistics.service';

@Module({
  imports: [HttpModule],
  controllers: [StatisticsController],
  providers: [StatisticsService, MarketStatisticsService, AelfWeb3Service],
})
export class StatisticsModule {}
