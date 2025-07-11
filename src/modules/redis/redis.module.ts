import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports:[
    ConfigModule
  ],
  controllers: [RedisController],
  providers: [RedisService],
  exports:[RedisService]
})
export class RedisModule {}
