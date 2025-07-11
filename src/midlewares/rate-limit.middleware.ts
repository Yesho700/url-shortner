import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from 'src/modules/redis/redis.service';

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async use(request: Request, response: Response, next: NextFunction) {
      
      const xForwardedFor = request.headers['x-forwarded-for'];
      const ip =
        (typeof xForwardedFor === 'string'
          ? xForwardedFor.split(',')[0]?.trim()
          : xForwardedFor?.[0]?.trim()) ||
        request.socket?.remoteAddress ||
        request.ip ||
        'unknown';

      const key = `rate-limit:${ip}`;

      const windowSec = this.configService.get<number>('RATE_WINDOW') || 60;
      const limit = this.configService.get<number>('RATE_LIMIT') || 10;

      // Check if rate limit is exceeded
      const isRateLimitExceeded = await this.redisService.isRateLimitExceeded(key, windowSec, limit);

      if (isRateLimitExceeded) {
        console.log(`Rate limit exceeded for IP: ${ip}`);
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }

      next();
  }
}