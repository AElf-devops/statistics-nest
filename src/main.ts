import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {ValidationPipe} from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // whitelist 的使用，可以避免不必要的参数传递；但是用起来有点奇怪。好像是打开了就需要在 dto 中定义所有的参数，否则会报错。
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //   }),
  // );

  await app.listen(7050);
}
bootstrap();
