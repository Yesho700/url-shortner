import { Schema } from '@nestjs/mongoose';
import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBody, ApiParam, ApiProperty, ApiProduces, ApiHeader } from '@nestjs/swagger';
import { LongUrlDto } from './dtos/longUrl-dto';


export class ShortUrlResponseDto {
  @ApiProperty({ description: 'The shortened URL', example: 'https://short.url/abc123' })
  shortUrl: string;
}


export const urlTagSwagger = () => ApiTags('URL Shortener');


export const shortenSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Shorten a long URL', description: 'Creates a shortened URL from a provided long URL.' }),
    ApiBody({
      description: 'The long URL to shorten',
      type: LongUrlDto,
      examples: {
        example1: {
          summary: 'Valid URL',
          value: { longUrl: 'https://example.com/very/long/url' },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'The shortened URL has been successfully created.',
      type: ShortUrlResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid URL provided.',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error occurred while processing the request.',
    }),
  );


export const resolveSwagger = () =>
  applyDecorators(
    ApiOperation({ 
      summary: 'Resolve a shortened URL', 
      description: 'Redirects to the original URL corresponding to the provided short URL code. When accessed through Swagger UI, returns a JSON response instead of redirecting.' 
    }),
    ApiParam({
      name: 'code',
      required: true,
      description: 'The short URL code to resolve',
      type: String,
      example: 'abc123',
      schema: { minLength: 1 }
    }),
    ApiResponse({
      status: HttpStatus.FOUND,
      description: 'URL redirected successfully - The response will automatically redirect to the original URL',
      headers: {
        Location: {
          description: 'The original URL to redirect to',
          schema: { 
            type: 'string', 
            example: 'https://original-url.com',
            format: 'uri' 
          }
        }
      },
      content: {
        'application/json': {
          example: {
            message: 'URL would redirect to original location',
            url: 'https://original-url.com',
            statusCode: 302
          }
        }
      }
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Short URL code not found',
      content: {
        'application/json': {
          example: {
            message: 'Short URL not found',
            error: 'Not Found',
            statusCode: 404
          }
        }
      }
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error occurred while processing the request',
      content: {
        'application/json': {
          example: {
            message: 'Failed to resolve URL',
            error: 'Internal Server Error',
            statusCode: 500
          }
        }
      }
    }),
    ApiProduces('application/json'),
    ApiHeader({
      name: 'Accept',
      description: 'Accept header',
      required: false,
      example: 'application/json'
    })
  );

export const getTotalClicksForLongUrlSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get total clicks for a long URL',
      description: 'Retrieves the total number of clicks for all shortened URLs associated with the provided long URL.',
    }),
    ApiParam({
      name: 'longUrl',
      description: 'The long URL to query total clicks for',
      type: String,
      example: 'https://example.com/very/long/url',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved total clicks for the long URL.',
      schema: {
        type: 'object',
        properties: {
          longUrl: { type: 'string', example: 'https://example.com/very/long/url' },
          totalClicks: { type: 'number', example: 100 },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'No records found for the provided long URL.',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error occurred while processing the request.',
    }),
  );

export const getTotalClicksForShortCodeSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get clicks for a short code',
      description: 'Retrieves the number of clicks for a specific shortened URL code.',
    }),
    ApiParam({
      name: 'shortCode',
      description: 'The short code to query clicks for',
      type: String,
      example: 'abc123',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved clicks for the short code.',
      schema: {
        type: 'object',
        properties: {
          shortCode: { type: 'string', example: 'abc123' },
          totalClicks: { type: 'number', example: 50 },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'No record found for the provided short code.',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error occurred while processing the request.',
    }),
  );

export const getOverallTotalClicksSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get overall total clicks',
      description: 'Retrieves the total number of clicks across all shortened URLs.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Successfully retrieved overall total clicks.',
      schema: {
        type: 'object',
        properties: {
          totalClicks: { type: 'number', example: 1000 },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error occurred while processing the request.',
    }),
  );