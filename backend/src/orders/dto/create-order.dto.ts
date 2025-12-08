import { IsArray, IsOptional, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemModifierDto {
  @IsString()
  modifierOptionId: string;

  @IsOptional()
  @IsNumber()
  price?: number;
}

class CreateOrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  modifiers?: CreateOrderItemModifierDto[];
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  locationId: string;

  @IsOptional()
  @IsString()
  promocodeCode?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
