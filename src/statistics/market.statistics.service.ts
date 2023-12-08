import {Inject, Injectable, Logger} from '@nestjs/common';
import BigNumber from 'bignumber.js';
import {HttpService} from '@nestjs/axios';
import {ConfigService} from '@nestjs/config';
import {CoinDto} from './dto/market.dto';
import {StatisticsService} from './statistics.service';
import { catchError, firstValueFrom } from 'rxjs';
import {CACHE_MANAGER} from '@nestjs/cache-manager';
import {Cache} from 'cache-manager';

interface IVolume24h {
  [key: string]: number
}

interface ICoinsDataCache {
  timestamp: number,
  data: CoinDto[]
}

@Injectable()
export class MarketStatisticsService {
  private getMarketInfoWithCacheLock: boolean
  private readonly logger = new Logger(MarketStatisticsService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly statisticsService: StatisticsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.getMarketInfoWithCacheLock = false;
  }

  async getVolume24h(symbol: string, covert: string = 'USD'): Promise<IVolume24h> {
    return this.getVolume24hFromCMC(symbol, covert)
  }

  async getVolume24hFromCMC (symbol: string, covert: string = 'USD'): Promise<IVolume24h> {
    const covertList = covert.split(',');
    const promises = [];
    covertList.forEach((item) => {
      promises.push(
        firstValueFrom(this.httpService.get(
          `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=200&convert=${item}`,
          {
            headers: {
              'X-CMC_PRO_API_KEY': this.configService.get('CMC_PRO_API_KEY'),
            }
          }
        ).pipe(catchError((error) => {
          this.logger.error(error.response.data);
          throw 'An error happened!';
        })))
      );
    });
    const results = await Promise.all(promises);

    let volumes24h: IVolume24h = {};
    results.forEach((result, index) => {
      const marketData: any = result.data.data.find((item: any) => item.symbol === symbol);
      this.logger.log('marketData', marketData);
      volumes24h[covertList[index]] = marketData.quote[covertList[index]].volume_24h;
    });

    return volumes24h;
  }

  async getMarketInfoWithCache(symbol: string): Promise<CoinDto[]> {
    const cacheExpireTime= this.configService.get('CACHE_EXPIRE_TIME_OF_TOKEN_MARKET_INFO');
    const coinsDataCache: ICoinsDataCache = await this.cacheManager.get('coinsDataCache');
    if (!coinsDataCache) {
      return await this.updateMarketInfo(symbol);
    }
    const coinsDataCacheExpireTime: number = new BigNumber(coinsDataCache.timestamp).plus(cacheExpireTime).toNumber();
    const dataNow = new Date().getTime();
    this.logger.log('market info cache status: ', dataNow, coinsDataCacheExpireTime, coinsDataCache.timestamp, cacheExpireTime);
    if (coinsDataCacheExpireTime > dataNow) {
      this.logger.log('use cache only, expired after', (dataNow - coinsDataCacheExpireTime)/1000, 's');
      return coinsDataCache.data;
    }

    this.logger.log('updateMarketInfo and cache and throw cache to user');
    if (!this.getMarketInfoWithCacheLock) {
      this.getMarketInfoWithCacheLock = true;
      await this.updateMarketInfo(symbol);
      this.getMarketInfoWithCacheLock = false;
    }
    return coinsDataCache.data;

  }
  async updateMarketInfo(symbol: string): Promise<CoinDto[]> {
    const dataFromCoingecko = await firstValueFrom(this.httpService.get(this.configService.get('COINGECKO_ELF')));
    const volume24h: IVolume24h = await this.getVolume24h(symbol, 'KRW,USD,IDR,SGD,THB');
    const tokenInfo = await this.statisticsService.getTokenInfo(symbol);
    if (dataFromCoingecko.status !== 200 || tokenInfo.code !== 0) {
      throw Error('Get data failed');
    }
    const data = dataFromCoingecko.data;
    const FIAT_LIST = ['krw', 'usd', 'idr', 'sgd', 'thb'];
    const coinsData = FIAT_LIST.map((item) => {
      const price = data.market_data.current_price[item];
      // symbol: string
      // currencyCode: string
      // price: number
      // marketCap: number
      // accTradePrice24h: number
      // circulatingSupply: number
      // maxSupply: number
      // provider: string
      // lastUpdatedTimestamp: number
      return {
        symbol: 'ELF',
        currencyCode: item,
        price: price,
        marketCap: new BigNumber(price).multipliedBy(tokenInfo.data.circulatingSupply).toNumber(),
        accTradePrice24h: volume24h[item.toUpperCase()],
        circulatingSupply: new BigNumber(tokenInfo.data.circulatingSupply).toNumber(), // 走浏览器接口
        maxSupply: new BigNumber(tokenInfo.data.totalSupply).toNumber(), // Total supply
        provider: 'AELF',
        lastUpdatedTimestamp: new Date().getTime()
      }
    });
    const coinsDataCache: ICoinsDataCache = {
      timestamp: new Date().getTime(),
      data: coinsData
    };
    await this.cacheManager.set('coinsDataCache', coinsDataCache, {ttl: 0} );

    return coinsData;
  }
}

