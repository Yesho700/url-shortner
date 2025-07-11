import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './config/configuration';
import { UrlModule } from './modules/url/url.module';
import { RedisModule } from './modules/redis/redis.module';
import { RateLimiterMiddleware } from './midlewares/rate-limit.middleware';

@Module({
  imports: [

    /* 
        loads Env File Configuration
    */
    ConfigModule.forRoot({
      envFilePath: '.env',
      load: [configuration]
    }),

    /* 
        Establishing MongoDB Connection
    */
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          uri: configService.get<string>('db.uri'),
        }
      }
    }),

    UrlModule,
    RedisModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
    .apply(RateLimiterMiddleware)
    .forRoutes("*"); // for all the Routes Rate Limit is used
  }
}
