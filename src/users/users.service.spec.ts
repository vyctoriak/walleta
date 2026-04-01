import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockUser = {
  id: 1,
  telegramId: BigInt(123456789),
  firstName: 'Maria',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('findOrCreate', () => {
    it('deve criar um novo usuário quando não existe', async () => {
      prisma.user.upsert.mockResolvedValue(mockUser);

      const result = await service.findOrCreate(BigInt(123456789), 'Maria');

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
        update: {},
        create: {
          telegramId: BigInt(123456789),
          firstName: 'Maria',
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('deve retornar usuário existente sem duplicar', async () => {
      prisma.user.upsert.mockResolvedValue(mockUser);

      const result = await service.findOrCreate(BigInt(123456789));

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
        update: {},
        create: {
          telegramId: BigInt(123456789),
          firstName: null,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('deve passar firstName como null quando não fornecido', async () => {
      prisma.user.upsert.mockResolvedValue(mockUser);

      await service.findOrCreate(BigInt(999));

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ firstName: null }),
        }),
      );
    });
  });

  describe('findByTelegramId', () => {
    it('deve retornar o usuário quando encontrado', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByTelegramId(BigInt(123456789));

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { telegramId: BigInt(123456789) },
      });
      expect(result).toEqual(mockUser);
    });

    it('deve retornar null quando usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findByTelegramId(BigInt(999));

      expect(result).toBeNull();
    });
  });
});
