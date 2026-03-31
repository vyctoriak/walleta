import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreate(telegramId: bigint, firstName?: string) {
    return this.prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: {
        telegramId,
        firstName: firstName ?? null,
      },
    });
  }

  async findByTelegramId(telegramId: bigint) {
    return this.prisma.user.findUnique({
      where: { telegramId },
    });
  }
}
