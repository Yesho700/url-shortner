import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UrlDocument = Url & Document;

@Schema({ timestamps: true })
export class Url {
  @Prop({ required: true })
  longUrl: string;

  @Prop({ required: true, unique: true, index: true })
  shortCode: string;

  @Prop({ default: 0 })
  clicks: number;

  @Prop()
  userId?: string;

  @Prop({
      type: Date,
      default: () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
      index: { expires: 0 }
    })
  expiresAt: Date;

}

export const UrlSchema = SchemaFactory.createForClass(Url);