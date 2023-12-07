import {Controller, Get, Query} from '@nestjs/common';
import {StatisticsService} from './statistics.service';
import {MarketStatisticsService} from './market.statistics.service';
import {CoinDto} from './dto/market.dto';
import {ErrorDto} from '../dto/error.dto';

@Controller('statistics')
export class StatisticsController {
  constructor(
    private readonly statisticsService: StatisticsService,
    private readonly marketStatisticsService: MarketStatisticsService,
  ) {}

  @Get('token')
  async getTokenInfo(@Query('symbol') symbol: string): Promise<string | ErrorDto> {
    if (symbol !== 'ELF') {
      return {
        msg: 'not support yet',
        code: -1,
      };
    }
    return this.statisticsService.getTokenInfo(symbol);
  }

  @Get('market')
  async getMarketInfo(@Query('symbol') symbol: string): Promise<CoinDto[] | ErrorDto> {
    if (symbol !== 'ELF') {
      return {
        msg: 'only supply ELF',
        code: -1,
      }
    }
    return await this.marketStatisticsService.getMarketInfoWithCache(symbol);
    // upbit just need to return the result
    // if (exchange === 'upbit') {
    //   return result;
    // }
    //
    // return {
    //   msg: "success",
    //   code: 0,
    //   data: result
    // };
  }

  // Test only
  // @Get('market-test')
  // async getMarketInfoTest(@Query('symbol') symbol: string): Promise<any> {
  //   if (symbol !== 'ELF') {
  //     return {
  //       msg: 'only supply ELF',
  //       code: -1,
  //     }
  //   }
  //   return this.marketStatisticsService.getVolume24h(symbol, 'KRW,USD,IDR,SGD,THB');
  // }
}
