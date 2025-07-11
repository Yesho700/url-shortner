import { Module } from '@nestjs/common';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Url, UrlSchema } from './models/url-shcema';
import { RedisModule } from '../redis/redis.module';

@Module({

  imports: [

    RedisModule,
    MongooseModule.forFeature([
      {name: Url.name, schema: UrlSchema}
    ])
  ],
  controllers: [UrlController],
  providers: [UrlService],
})
export class UrlModule {}
