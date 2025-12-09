import { Module } from '@nestjs/common';
import { TVBoardController } from './tv-board.controller';
import { TVBoardService } from './tv-board.service';

@Module({
  controllers: [TVBoardController],
  providers: [TVBoardService],
  exports: [TVBoardService],
})
export class TVBoardModule {}

