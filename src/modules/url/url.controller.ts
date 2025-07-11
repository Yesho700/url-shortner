import { ApiHeader } from '@nestjs/swagger';

import { Body, Controller, Post, Request, Response, Param, Get, HttpStatus} from '@nestjs/common';
import { UrlService } from './url.service';

import { LongUrlDto } from './dtos/longUrl-dto';
import { getOverallTotalClicksSwagger, getTotalClicksForLongUrlSwagger, getTotalClicksForShortCodeSwagger, resolveSwagger, shortenSwagger, urlTagSwagger } from './url-swagger';



@urlTagSwagger()
@Controller('')
export class UrlController {

  constructor(
    private readonly urlServices: UrlService
  ){}

  @Post('shorten')
  @shortenSwagger()
  async shortenUrl(
    @Body() longUrlData: LongUrlDto,
    @Request() request: any
  ){
      const { longUrl } = longUrlData;
      return await this.urlServices.shortenUrl(longUrl)
  }
  
  @Get(':code')
  @resolveSwagger()
  async resolveUrl(
    @Param('code') shortUrl: string,
    @Request() request,
    @Response() response
  ){
    const longUrl = await this.urlServices.resolveUrl(shortUrl);
    
    const isSwagger = request.headers['referer']?.includes('/swagger-ui')
    
    if (isSwagger) {
      return response.status(HttpStatus.OK).json({ 
        message: 'URL would redirect to original location',
        url: longUrl,
        statusCode: HttpStatus.FOUND
      });
    }
    return response.redirect(HttpStatus.FOUND, longUrl);
  }

  @Get('clicks/long/:longUrl')
  @getTotalClicksForLongUrlSwagger()
  async getTotalClicksForLongUrl(@Param('longUrl') longUrl: string) {
    return {
      statusCode: HttpStatus.OK,
      longUrl,
      totalClicks: await this.urlServices.getTotalClicksForLongUrl(longUrl),
    };
  }

  @Get('clicks/short/:shortCode')
  @getTotalClicksForShortCodeSwagger()
  async getTotalClicksForShortCode(@Param('shortCode') shortCode: string) {
    return {
      statusCode: HttpStatus.OK,
      shortCode,
      totalClicks: await this.urlServices.getTotalClicksForShortCode(shortCode),
    };
  }

  @Get('clicks/total')
  @getOverallTotalClicksSwagger()
  async getOverallTotalClicks() {
    return {
      statusCode: HttpStatus.OK,
      totalClicks: await this.urlServices.getOverallTotalClicks(),
    };
  }
}
