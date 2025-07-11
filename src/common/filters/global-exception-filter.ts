import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';
import { Error as MongooseError } from 'mongoose';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: string[] = [];

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message = typeof response === 'string' ? response : response['message'];
      if (typeof response === 'object' && Array.isArray(response['message'])) {
        errors = response['message'];
      }
    }
    // Handle Mongoose ValidationError
    else if (exception instanceof MongooseError.ValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Validation failed';
      errors = Object.values(exception.errors).map((err) => err.message);
    }
    // Handle Mongoose CastError (invalid ID format, etc)
    else if (exception instanceof MongooseError.CastError) {
      status = HttpStatus.BAD_REQUEST;
      message = `Invalid ${exception.path}: ${exception.value}`;
    }
    // Handle MongoDB duplicate key error
    else if (exception instanceof MongoError && exception.code === 11000) {
      status = HttpStatus.CONFLICT;
      message = 'Duplicate key error';
      const key = Object.keys((exception as any).keyPattern)[0];
      const value = (exception as any).keyValue[key];
      errors = [`${key} with value ${value} already exists`];
    }
    // Handle other MongoDB errors
    else if (exception instanceof MongoError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Database operation failed';
      errors = [exception.message];
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
}