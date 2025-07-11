import { IsUrl, IsNotEmpty } from 'class-validator';

export class LongUrlDto {
    @IsUrl()
    @IsNotEmpty()
    longUrl: string;
}