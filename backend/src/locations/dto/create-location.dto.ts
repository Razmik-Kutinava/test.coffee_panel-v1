import { IsBoolean, IsOptional, IsString, MinLength, MaxLength, IsEnum } from 'class-validator';
import { LocationStatus } from '@prisma/client';

export class CreateLocationDto {
  @IsString()
  @MinLength(2, { message: 'Название должно быть минимум 2 символа' })
  @MaxLength(100, { message: 'Название не должно превышать 100 символов' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  slug?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;
}
