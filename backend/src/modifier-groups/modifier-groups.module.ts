import { Module } from '@nestjs/common';
import { ModifierGroupsService } from './modifier-groups.service';
import { ModifierGroupsController } from './modifier-groups.controller';

@Module({
  controllers: [ModifierGroupsController],
  providers: [ModifierGroupsService],
  exports: [ModifierGroupsService],
})
export class ModifierGroupsModule {}

