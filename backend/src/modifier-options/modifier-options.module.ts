import { Module } from '@nestjs/common';
import { ModifierOptionsService } from './modifier-options.service';
import { ModifierOptionsController } from './modifier-options.controller';

@Module({
  controllers: [ModifierOptionsController],
  providers: [ModifierOptionsService],
  exports: [ModifierOptionsService],
})
export class ModifierOptionsModule {}

