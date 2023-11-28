import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import {HttpModule} from '@nestjs/axios';
import {AelfWeb3Service} from '../aelf.web3.service';

@Module({
  imports: [HttpModule],
  controllers: [StatisticsController],
  providers: [StatisticsService, AelfWeb3Service],
})
export class StatisticsModule {}
