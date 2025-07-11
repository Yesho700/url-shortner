import { RedisService } from 'src/modules/redis/redis.service';
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Url, UrlDocument } from './models/url-shcema';
import { Model } from 'mongoose';
import * as shortid from 'shortid';
import { LongUrlDto } from './dtos/longUrl-dto';

@Injectable()
export class UrlService {
    /**
     * Cache expiration time in seconds (1 hour)
     */
    private readonly CACHE_EXPIRATION = 60 * 60;

    constructor(
        @InjectModel(Url.name)
        private readonly urlModel: Model<UrlDocument>,
        private readonly redisService: RedisService
    ) {}

    /**
     * Shortens a long URL by generating a unique short code
     * @param {string} longUrl - The original URL to be shortened
     * @returns {Promise<{shortUrl: string}>} Object containing the generated short code
     * @throws {InternalServerErrorException} If shortening operation fails
     */
    async shortenUrl(longUrl: string): Promise<{ message: string, shortUrl: string }> {
        try {
            // Check cache
            const cachedCode = await this.redisService.get(`url:${longUrl}`);
            if (cachedCode) return { message:" Short URL Already Exists", shortUrl: cachedCode };

            // Check database
            const existingUrl = await this.urlModel.findOne({ longUrl }).exec();
            if (existingUrl) {
                await Promise.all([
                    this.redisService.set(`url:${existingUrl.longUrl}`, existingUrl.shortCode, this.CACHE_EXPIRATION),
                    this.redisService.set(`code:${existingUrl.shortCode}`, existingUrl.longUrl, this.CACHE_EXPIRATION),
                ]);
                return { message:" Short URL Already Exists", shortUrl: existingUrl.shortCode };
            }

            const shortCode = shortid.generate().substring(0, 8);

            const newUrl = new this.urlModel({ longUrl, shortCode });
            await newUrl.save();

            // Update cache
            await Promise.all([
                this.redisService.set(`url:${longUrl}`, shortCode, this.CACHE_EXPIRATION),
                this.redisService.set(`code:${shortCode}`, longUrl, this.CACHE_EXPIRATION),
            ]);

            return { message: "Short URL Created Successfully!!", shortUrl: shortCode };
        } catch (error) {
            throw new InternalServerErrorException('Failed to shorten URL');
        }
    }

    /**
     * Increments the click counter for a short URL
     * @param {string} shortUrl - The short code to update clicks for
     * @returns {Promise<void>}
     */
    async updateClicks(shortUrl: string): Promise<void> {
        this.urlModel.findOneAndUpdate(
            { shortCode: shortUrl },
            { $inc: { clicks: 1 } }
        ).exec().catch(err => 
            console.error('Failed to update clicks:', err)
        );
    }

    /**
     * Resolves a short URL to its original long URL
     * @param {string} shortUrl - The short code to resolve
     * @returns {Promise<string>} The original long URL
     * @throws {NotFoundException} If the short URL is not found
     * @throws {InternalServerErrorException} If resolution fails
     */
    async resolveUrl(shortUrl: string): Promise<string> {
        try {
            // Checking Cache
            const cachedUrl = await this.redisService.get(`code:${shortUrl}`);
            if (cachedUrl) {
                this.updateClicks(shortUrl); // Handling clicks Asynchronously
                return cachedUrl;
            }

            // Fallback to Database
            const urlDoc = await this.urlModel.findOneAndUpdate(
                { shortCode: shortUrl },
                { $inc: { clicks: 1 } },
                { new: true }
            ).exec();

            if (urlDoc) {

                await this.redisService.set(`code:${shortUrl}`, urlDoc.longUrl, this.CACHE_EXPIRATION);
                return urlDoc.longUrl;
            }

            throw new NotFoundException("No URL Found");
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException('Failed to resolve URL');
        }
    }

    /**
   * Retrieves the total number of clicks for all shortened URLs associated with a specific long URL.
   * @param longUrl The original long URL to query clicks for.
   * @returns A promise that resolves to the total number of clicks, or 0 if no records are found.
   */
  async getTotalClicksForLongUrl(longUrl: string): Promise<number> {
    const result = await this.urlModel
      .findOne({ longUrl })
      .select('clicks')
      .lean();

    if(result){
        return result.clicks;
    }

    throw new NotFoundException("URL Not found!!!");
  }

  /**
   * Retrieves the number of clicks for a specific shortened URL code.
   * @param shortCode The unique short code of the shortened URL.
   * @returns A promise that resolves to the number of clicks, or 0 if the short code is not found.
   */
  async getTotalClicksForShortCode(shortCode: string): Promise<number> {
    const result = await this.urlModel
      .findOne({ shortCode })
      .select('clicks')
      .lean();
    
    if(result){
        return result.clicks;
    }

    throw new NotFoundException("URL Not found!!!");
  }

  /**
   * Retrieves the total number of clicks across all shortened URLs in the database.
   * @returns A promise that resolves to the overall total number of clicks, or 0 if no records exist.
   */
  async getOverallTotalClicks(): Promise<number> {
    const result = await this.urlModel.aggregate([
      { $group: { _id: null, totalClicks: { $sum: '$clicks' } } },
    ]);
    return result.length > 0 ? result[0].totalClicks : 0;
  }
}