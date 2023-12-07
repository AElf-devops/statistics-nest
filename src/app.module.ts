import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StatisticsModule } from './statistics/statistics.module';
import {ConfigModule} from '@nestjs/config';
import {ScheduleModule} from '@nestjs/schedule';
import {HttpModule} from '@nestjs/axios';
import {TasksModule} from './task/tasks.module';
import { HelloModule } from './hello/hello.module';
import {dataBaseConfig, dataBaseConfigByNamespace, uriFromEnv} from './config/hello.config';
import * as Joi from '@hapi/joi';
import { APP_INTERCEPTOR } from '@nestjs/core';

import type { RedisClientOpts } from 'redis';
// https://github.com/node-cache-manager/node-cache-manager/issues/210
// store.get not working with v5
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    StatisticsModule,
    TasksModule,
    HttpModule,
    HelloModule,
    ConfigModule.forRoot({
      // Todo: if too much config, move it to ./config.
      isGlobal: true,
      load: [dataBaseConfig, dataBaseConfigByNamespace, uriFromEnv],
      validationSchema: Joi.object({
        NODE_PROVIDER: Joi.string().required(),
        DEFAULT_PRIVATE_KEY: Joi.string().required(),
        EXPLORE_URL: Joi.string().required(),
        TOKEN_CONTRACT_ADDRESS: Joi.string().required(),
        EXCLUDE_ADDRESSES: Joi.string().required(),
        COINGECKO_ELF: Joi.string().required(),
        CMC_PRO_API_KEY: Joi.string().required(),
        CACHE_EXPIRE_TIME_OF_TOKEN_INFO: Joi.number().required(),
        CACHE_EXPIRE_TIME_OF_TOKEN_MARKET_INFO: Joi.number().required(),
        PORT: Joi.number().default(7050),
        NODE_ENV: Joi.string().valid(
          'development', 'production', 'test', 'provision'
        ).default('development'),
      }),
      validationOptions: {
        // allowUnknown: false, // default: true
        // if true, stops validation on the first error; if false, returns all errors. Defaults to false.
        // abortEarly: true, // default: fale
      },
    }),
    ScheduleModule.forRoot(),
    CacheModule.register<RedisClientOpts>({
      store: redisStore,
      host: 'localhost',
      port: 6379,
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    }
  ],
})
export class AppModule {}
