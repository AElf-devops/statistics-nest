import {registerAs} from '@nestjs/config';
import * as process from 'process';

export const dataBaseConfig =  () => ({
  // port: parseInt(process.env.PORT, 10) || 3000,
  // database: {
  //   host: process.env.DATABASE_HOST,
  //   port: parseInt(process.env.DATABASE_PORT, 10) || 5432
  // }
  port: parseInt('3306', 10) || 3000,
  database: {
    host: 'normal.host',
    port: 'normal.port'
  }
});

export const dataBaseConfigByNamespace = registerAs('databaseByNamespace', () => ({
  host: 'namespace.host',
  port: 'namespace.port',
}));

export const uriFromEnv = () => ({
  COINGECKO_ELF: process.env.COINGECKO_ELF
});

