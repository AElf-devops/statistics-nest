import {Inject, Injectable, Logger, Param} from '@nestjs/common';
import BigNumber from 'bignumber.js';
import {HttpService} from '@nestjs/axios';
import {ConfigService} from '@nestjs/config';
import {AelfWeb3Service} from '../web3/aelf.web3.service';
import {CACHE_MANAGER} from '@nestjs/cache-manager';
import {Cache} from 'cache-manager';

interface IBalanceOfEcosystemIncentivesCache {
  balance: BigNumber,
  timestamp: number
}

let tokenContract;

@Injectable()
export class StatisticsService {
  private readonly testStr: string
  private balanceRefreshLock: boolean
  private readonly EXCLUDE_ADDRESSES: string[]
  private readonly logger = new Logger(StatisticsService.name);
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly aelfWeb3Service: AelfWeb3Service,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.testStr = 'testStr';
    this.balanceRefreshLock = false;
    this.EXCLUDE_ADDRESSES = this.configService.get('EXCLUDE_ADDRESSES').split(',');
  }
  async getTokenInfo(symbol: string): Promise<any> {
    const balanceOfEcosystemIncentives = await this.getBalanceOfEcosystemIncentivesWithCache(symbol);
    const result = await this.getTokenInfoFromExplorer(symbol);
    this.logger.log('result', result.data);
    const data = {
      ...result.data.data,
      circulatingSupply: new BigNumber(result.data.data.totalSupply).minus(balanceOfEcosystemIncentives).toString()
    }
    return {
      ...result.data,
      data
    };
  }

  async getTokenInfoFromExplorer(symbol: string): Promise<any> {
    return this.httpService.get(`${this.configService.get('EXPLORE_URL')}/api/viewer/tokenInfo?symbol=${symbol}`).toPromise();
  }

  async getBalanceOfEcosystemIncentivesWithCache(symbol: string): Promise<BigNumber> {
    if (!tokenContract) {
      this.logger.log('token contract init start');
      tokenContract = await this.aelfWeb3Service.aelf.chain.contractAt(
        this.configService.get('TOKEN_CONTRACT_ADDRESS'),
        this.aelfWeb3Service.wallet
      );
      this.logger.log('token contract init end');
    }
    const balanceOfEcosystemIncentivesCache: IBalanceOfEcosystemIncentivesCache
      = await this.cacheManager.get('balanceOfEcosystemIncentivesCache');
    if (!balanceOfEcosystemIncentivesCache) {
      this.logger.log('no cache');
      const balanceOfEcosystemIncentives: BigNumber
        = await this.getTotalBalanceOfAddresses(symbol, tokenContract, this.EXCLUDE_ADDRESSES);
      await this.cacheManager.set('balanceOfEcosystemIncentivesCache', {
        balance: balanceOfEcosystemIncentives,
        timestamp: Date.now()
      }, { ttl: 0 })
      return balanceOfEcosystemIncentives;
    }

    const cacheExpireTime= this.configService.get('CACHE_EXPIRE_TIME_OF_TOKEN_INFO');
    const balanceDataCacheExpireTime: number
      = new BigNumber(balanceOfEcosystemIncentivesCache.timestamp).plus(cacheExpireTime).toNumber();
    const dataNow = Date.now();
    this.logger.log('balance cache status: ', dataNow, balanceDataCacheExpireTime, balanceOfEcosystemIncentivesCache.timestamp, cacheExpireTime);
    if (balanceDataCacheExpireTime > dataNow) {
      this.logger.log('use cache only, expired after', (dataNow - balanceDataCacheExpireTime)/1000, 's');
      return balanceOfEcosystemIncentivesCache.balance;
    }
    if (!this.balanceRefreshLock) {
      this.logger.log('cache need to be update');
      this.balanceRefreshLock = true;
      await this.getTotalBalanceOfAddresses(symbol, tokenContract, this.EXCLUDE_ADDRESSES);
      this.balanceRefreshLock = false;
      this.logger.log('cache updated');
    }
    return balanceOfEcosystemIncentivesCache.balance;

  }

  async getTotalBalanceOfAddresses(symbol: string, tokenContract: any, addresses: string[]): Promise<BigNumber> {
    const getBalances = addresses.map(address => {
      this.logger.log('getTotalBalanceOfAddresses: ', address, symbol);
      return tokenContract.GetBalance.call({
        symbol,
        owner: address
      });
    });
    const balances = await Promise.all(getBalances);
    const balance = balances.reduce((acc, cur) => {
      return acc.plus(new BigNumber(cur.balance).div(10**8));
    }, new BigNumber(0));
    this.logger.log('balances: ', balances, balance.toString());
    return balance;
  }
}

