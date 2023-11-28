import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
const AElf = require('aelf-sdk');
const Wallet = AElf.wallet;
let aelf = new AElf();
@Injectable()
export class AelfWeb3Service {
  aelf: any
  wallet: any
  constructor(
    private readonly configService: ConfigService
  ) {
    this.wallet = Wallet.getWalletByPrivateKey(this.configService.get('DEFAULT_PRIVATE_KEY'));
    aelf.setProvider(new AElf.providers.HttpProvider(this.configService.get('NODE_PROVIDER')));
    this.aelf = aelf;
    console.log('AelfWeb3Service: ', this.wallet.address, this.configService.get('NODE_PROVIDER'));
  }
}

