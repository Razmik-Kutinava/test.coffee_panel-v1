import { Module } from '@nestjs/common';
import { BaristaController } from './barista.controller';
import { BaristaService } from './barista.service';

@Module({
  controllers: [BaristaController],
  providers: [BaristaService],
  exports: [BaristaService],
})
export class BaristaModule {}

