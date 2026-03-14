import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { AiItemsModule } from '../ai-items/ai-items.module';

@Module({
  imports: [TransactionsModule, AiItemsModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}