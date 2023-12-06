import { Module } from '@nestjs/common';
import {HttpModule} from '@nestjs/axios';
import {TasksService} from './tasks.service';
import {StatisticsModule} from '../statistics/statistics.module';
import {StatisticsService} from '../statistics/statistics.service';
import {MarketStatisticsService} from '../statistics/market.statistics.service';
import {AelfWeb3Service} from '../web3/aelf.web3.service';
import {TasksController} from './task.controller';

@Module({
  imports: [StatisticsModule, HttpModule],
  controllers: [TasksController],
  providers: [TasksService, StatisticsService, MarketStatisticsService, AelfWeb3Service],
})
export class TasksModule {}
