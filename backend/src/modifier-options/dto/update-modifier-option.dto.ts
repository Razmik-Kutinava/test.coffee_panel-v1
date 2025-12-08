import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateModifierOptionDto } from './create-modifier-option.dto';

export class UpdateModifierOptionDto extends PartialType(OmitType(CreateModifierOptionDto, ['groupId'] as const)) {}

