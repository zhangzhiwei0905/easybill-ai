import { Module } from '@nestjs/common';
import { AiItemsController } from './ai-items.controller';
import { AiItemsService } from './ai-items.service';

@Module({
  controllers: [AiItemsController],
  providers: [AiItemsService],
  exports: [AiItemsService],
})
export class AiItemsModule {}
