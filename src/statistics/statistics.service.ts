import {Injectable, Param} from '@nestjs/common';
import BigNumber from 'bignumber.js';
import {HttpService} from '@nestjs/axios';
import {ConfigService} from '@nestjs/config';
import {AelfWeb3Service} from '../aelf.web3.service';

let balanceOfEcosystemIncentivesCache: {
  balance: BigNumber,
  timestamp: number
};

@Injectable()
export class StatisticsService {
  private readonly testStr: string
  private tokenContract: any
  private balanceRefreshLock: boolean
  private readonly EXCLUDE_ADDRESSES: string[]
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly aelfWeb3Service: AelfWeb3Service
  ) {
    this.testStr = 'testStr';
    this.balanceRefreshLock = false;
    this.EXCLUDE_ADDRESSES = this.configService.get('EXCLUDE_ADDRESSES').split(',');
  }
  async getTokenInfo(symbol: string): Promise<any> {
    if (symbol !== 'ELF') {
      return {
        msg: 'not support yet',
        code: -1,
      };
    }
    const balanceOfEcosystemIncentives = await this.getBalanceOfEcosystemIncentivesWithCache(symbol);
    const result = await this.getTokenInfoFromExplorer(symbol);
    console.log('result', result.data);
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
    console.log('token contract init start');
    if (!this.tokenContract) {
      this.tokenContract = await this.aelfWeb3Service.aelf.chain.contractAt(
        this.configService.get('TOKEN_CONTRACT_ADDRESS'),
        this.aelfWeb3Service.wallet
      );
    }
    console.log('token contract init end');
    if (!balanceOfEcosystemIncentivesCache) {
      console.log('no cache');
      const balanceOfEcosystemIncentives: BigNumber
        = await this.getTotalBalanceOfAddresses(symbol, this.tokenContract, this.EXCLUDE_ADDRESSES);
      balanceOfEcosystemIncentivesCache = {
        balance: balanceOfEcosystemIncentives,
        timestamp: Date.now()
      }
      return balanceOfEcosystemIncentives;
    } else {
      console.log('use cache');
      if ((balanceOfEcosystemIncentivesCache.timestamp < Date.now() - 1000 * 60 * 60 * 24)
        && !this.balanceRefreshLock) {
        console.log('cache need to be update');
        this.balanceRefreshLock = true;
        await this.getTotalBalanceOfAddresses(symbol, this.tokenContract, this.EXCLUDE_ADDRESSES);
        this.balanceRefreshLock = false;
        console.log('cache updated');
      }
      return balanceOfEcosystemIncentivesCache.balance;
    }
  }

  async getTotalBalanceOfAddresses(symbol: string, tokenContract: any, addresses: string[]): Promise<BigNumber> {
    const getBalances = addresses.map(address => {
      console.log('getTotalBalanceOfAddresses: ', address, symbol);
      return tokenContract.GetBalance.call({
        symbol,
        owner: address
      });
    });
    const balances = await Promise.all(getBalances);
    const balance = balances.reduce((acc, cur) => {
      return acc.plus(new BigNumber(cur.balance).div(10**8));
    }, new BigNumber(0));
    console.log('balances: ', balances, balance.toString());
    return balance;
  }
}

