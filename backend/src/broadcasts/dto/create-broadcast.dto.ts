import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { BroadcastScope } from '@prisma/client';

export class CreateBroadcastDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  buttonText?: string;

  @IsOptional()
  @IsString()
  buttonUrl?: string;

  @IsOptional()
  @IsEnum(BroadcastScope)
  scope?: BroadcastScope;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

