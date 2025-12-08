import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, MinLength } from 'class-validator';
import { ModifierType } from '@prisma/client';

export class CreateModifierGroupDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsEnum(ModifierType)
  type?: ModifierType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  minSelect?: number;

  @IsOptional()
  @IsNumber()
  maxSelect?: number;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

