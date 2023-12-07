import {Controller, Get, Post, Body, Patch, Param, Delete, Inject, ParseIntPipe, Query, Logger} from '@nestjs/common';
import { HelloService } from './hello.service';
import { CreateHelloDto } from './dto/create-hello.dto';
import { UpdateHelloDto } from './dto/update-hello.dto';
import {ConfigService, ConfigType} from '@nestjs/config';
import {dataBaseConfigByNamespace} from '../config/hello.config';
import {ValidateHelloDto, ValidateInputParams} from './dto/validate-hello.dto';
import {CACHE_MANAGER,} from '@nestjs/cache-manager';
import {Cache} from 'cache-manager';

@Controller('hello')
export class HelloController {
  private readonly logger = new Logger(HelloController.name);
  constructor(
    private readonly helloService: HelloService,
    private configService: ConfigService,
    @Inject(dataBaseConfigByNamespace.KEY)
    private dbConfigByNamespace: ConfigType<typeof dataBaseConfigByNamespace>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // http://127.0.0.1:7050/hello/world
  @Get('world')
  getHello(): any {
    return {
      normal: {
        host: this.configService.get('database.host'),
        port: this.configService.get('database.port'),
      },
      namespace: {
        host: this.dbConfigByNamespace.host,
        port: this.dbConfigByNamespace.port,
      },
      uri: {
        coingeckoElf: this.configService.get('COINGECKO_ELF')
      }
    }
  }

  // http://127.0.0.1:7050/hello/validate/12334
  @Get('validate/:id')
  validateHello(@Param() params: ValidateInputParams): ValidateHelloDto {
    return {
      name: params.id + '',
    }
  }

  // http://127.0.0.1:7050/hello/validate?id=12334
  @Get('validate')
  validateHelloQuery(
    @Query() params: ValidateInputParams,
  ): ValidateHelloDto {
    return {
      name: params.id + '',
    }
  }

  // http://127.0.0.1:7050/hello/transform?stringNumber=12&snToN=233&autoS2N=231
  @Get('transform')
  transform(
    @Query('stringNumber') stringNumber: string,
    // This will turn string to number
    // snToN: string is not use is this case.
    @Query('snToN', ParseIntPipe) snToN: string,
    // we set "transform: true" in global, autoS2N will transform to number.
    @Query('autoS2N') autoS2N: number
  ): any {
    console.log('type stringNumber: ', typeof stringNumber, stringNumber);
    console.log('type snToN: ', typeof snToN, snToN);
    console.log('type autoS2N: ', typeof autoS2N, autoS2N);
    return {
      stringNumber,
      snToN,
      autoS2N
    }
  }

  @Get('cache')
  async cache(@Query('cache') cache: string): Promise<any> {
    console.log('cache test');
    const cacheValue = await this.cacheManager.get('hello-cache');
    // const cacheValue = await this..;
    this.logger.log('cacheValue: ' + cacheValue, cache);
    if (cacheValue) {
      return cacheValue;
    }
    // cache-manager (v5) has switched to using milliseconds instead.
    await this.cacheManager.set('hello-cache', cache, {
      ttl: 100
    });
    const cacheValueTemp = await this.cacheManager.get('hello-cache');
    this.logger.log('cacheValueTemp: ' + cacheValueTemp);
    // await this.cacheManager.set('hello-cache', cache, 10);
    return cache;
  }

  @Post()
  create(@Body() createHelloDto: CreateHelloDto) {
    return this.helloService.create(createHelloDto);
  }

  @Get()
  findAll() {
    return this.helloService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.helloService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHelloDto: UpdateHelloDto) {
    return this.helloService.update(+id, updateHelloDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.helloService.remove(+id);
  }
}
