import Redis, { Redis as RedisClient } from 'ioredis';
import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';



@Injectable()
export class RedisService implements OnModuleInit{
    private redisClient: RedisClient;

    constructor(
        private readonly configService: ConfigService
    ){}
    

    async onModuleInit(){

        try{

            this.redisClient = new Redis({
                host: this.configService.get<string>('redis.host'),
                port: this.configService.get<number>('redis.port'),
                lazyConnect: true
            });
            
            this.redisClient.on('connect', () => {
                console.log(`Redis Connecting......`);
            });

            this.redisClient.on('ready', () => {
                console.log(`Redis Connected Successfully....!!!`)
            });

            this.redisClient.on('error', () => {
                console.log(`Error in Redis Connection!!`);
            });

            this.redisClient.on('close', () => {
                console.log(`Redis Connection get Closed..!!`)
            });

            await this.redisClient.connect();
        }
        catch(err){
            throw new InternalServerErrorException('Error in Redis Connection!!!')
        }
    }


    /**
     * Checks if the rate limit for a given key is exceeded using a sliding window counter.
     * Returns true if the limit is exceeded, false otherwise.
     * @param key The Redis key for the rate limit (e.g., 'rate-limit:ip:192.168.1.1')
     * @param windowSec The time window in seconds (e.g., 60 for 1 minute)
     * @param limit The maximum number of requests allowed within the window
     * @returns Promise<boolean> - true if limit exceeded, false if allowed.
     */
    async isRateLimitExceeded(key: string, windowSec: number, limit: number): Promise<boolean> {
        const now = Math.floor(Date.now() / 1000);
        const clearBefore = now - windowSec;

        try {
            // Execute Redis transaction to remove old entries and count current requests
            const multiResult = await this.redisClient
            .multi()
            .zremrangebyscore(key, 0, clearBefore)
            .zcard(key)
            .exec();

            if (multiResult === null) {
            console.error('Redis transaction was discarded for key:', key);
            throw new InternalServerErrorException('Redis transaction was discarded.');
            }

            const [zremrangebyscoreResult, zcardResult] = multiResult;

            // Check for errors in Redis commands
            if (zremrangebyscoreResult[0] || zcardResult[0]) {
            const errorMessage = [
                zremrangebyscoreResult[0]?.message || '',
                zcardResult[0]?.message || '',
            ]
                .filter(Boolean)
                .join('; ');
            // console.error(`Redis transaction error for key ${key}: ${errorMessage}`);
            throw new InternalServerErrorException(`Redis transaction error: ${errorMessage}`);
            }

            // Extract the request count from zcard result
            const requestCount = zcardResult[1] as number;
            // console.log(`Request count for ${key}: ${requestCount}, limit: ${limit}`);

            if (requestCount >= limit) {
            console.log(`Rate limit exceeded for ${key}`);
            return true;
            }

            // Add the current request timestamp to the sorted set
            await this.redisClient.zadd(key, now, now.toString());
            // Set expiration for the key to clean up after windowSec
            await this.redisClient.expire(key, windowSec);

            console.log(`Request allowed for ${key}`);
            return false;
        } catch (error) {
            console.error(`Error checking rate limit for key ${key}:`, error);
            throw new InternalServerErrorException('Failed to check rate limit due to an internal error.');
        }
    }
    async set(key: string, value: string, ttl?: number): Promise<void> {
        if (ttl) {
        await this.redisClient.setex(key, ttl, value);
        } else {
        await this.redisClient.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return this.redisClient.get(key);
    }

    async del(key: string): Promise<void> {
        await this.redisClient.del(key);
    }

    async increment(key: string): Promise<number> {
        return this.redisClient.incr(key);
    }

    async zAdd(key: string, score: number, member: string): Promise<void> {
        await this.redisClient.zadd(key, score, member );
    }

    async zRangeByScore(key: string, min: number, max: number): Promise<string[]> {
        return this.redisClient.zrangebyscore(key, min, max);
    }

}
