import { Module } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CashRegisterController],
  providers: [CashRegisterService, PrismaService],
})
export class CashRegisterModule {}
