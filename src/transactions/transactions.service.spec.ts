import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';

const mockTransaction = {
  id: 1,
  userId: 1,
  amount: 50,
  category: 'alimentação',
  description: 'mercado',
  date: new Date('2026-03-15'),
  createdAt: new Date(),
};

const mockPrismaService = {
  transaction: {
    create: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar uma transação com todos os campos', async () => {
      prisma.transaction.create.mockResolvedValue(mockTransaction);

      const dto = {
        userId: 1,
        amount: 50,
        category: 'alimentação',
        description: 'mercado',
        date: new Date('2026-03-15'),
      };

      const result = await service.create(dto);

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          amount: 50,
          category: 'alimentação',
          description: 'mercado',
          date: new Date('2026-03-15'),
        },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('deve usar null para description quando não fornecido', async () => {
      prisma.transaction.create.mockResolvedValue(mockTransaction);

      await service.create({
        userId: 1,
        amount: 30,
        category: 'transporte',
      });

      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ description: null }),
      });
    });

    it('deve usar data atual quando date não fornecido', async () => {
      prisma.transaction.create.mockResolvedValue(mockTransaction);

      await service.create({
        userId: 1,
        amount: 30,
        category: 'transporte',
      });

      const callArgs = prisma.transaction.create.mock.calls[0][0];
      expect(callArgs.data.date).toBeInstanceOf(Date);
    });
  });

  describe('getMonthlyTotal', () => {
    it('deve retornar o total do mês especificado', async () => {
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 1500 },
      });

      const result = await service.getMonthlyTotal(1, 3, 2026);

      expect(prisma.transaction.aggregate).toHaveBeenCalledWith({
        where: {
          userId: 1,
          date: {
            gte: new Date(2026, 2, 1),
            lt: new Date(2026, 3, 1),
          },
        },
        _sum: { amount: true },
      });
      expect(result).toBe(1500);
    });

    it('deve retornar 0 quando não há transações no mês', async () => {
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.getMonthlyTotal(1, 3, 2026);

      expect(result).toBe(0);
    });

    it('deve usar mês e ano atuais quando não fornecidos', async () => {
      prisma.transaction.aggregate.mockResolvedValue({
        _sum: { amount: 200 },
      });

      const now = new Date();
      const result = await service.getMonthlyTotal(1);

      const callArgs = prisma.transaction.aggregate.mock.calls[0][0];
      const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const expectedEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      expect(callArgs.where.date.gte).toEqual(expectedStart);
      expect(callArgs.where.date.lt).toEqual(expectedEnd);
      expect(result).toBe(200);
    });
  });

  describe('getByCategory', () => {
    it('deve retornar breakdown por categoria', async () => {
      const mockGroupBy = [
        { category: 'alimentação', _sum: { amount: 800 }, _count: 15 },
        { category: 'transporte', _sum: { amount: 300 }, _count: 8 },
      ];
      prisma.transaction.groupBy.mockResolvedValue(mockGroupBy);

      const result = await service.getByCategory(1, 3, 2026);

      expect(prisma.transaction.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        where: {
          userId: 1,
          date: {
            gte: new Date(2026, 2, 1),
            lt: new Date(2026, 3, 1),
          },
        },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      });
      expect(result).toEqual(mockGroupBy);
    });

    it('deve retornar array vazio quando sem dados', async () => {
      prisma.transaction.groupBy.mockResolvedValue([]);

      const result = await service.getByCategory(1, 1, 2026);

      expect(result).toEqual([]);
    });
  });

  describe('getRecentTransactions', () => {
    it('deve retornar últimas transações com limite padrão', async () => {
      const mockTransactions = [mockTransaction];
      prisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getRecentTransactions(1);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { date: 'desc' },
        take: 10,
      });
      expect(result).toEqual(mockTransactions);
    });

    it('deve respeitar limite customizado', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);

      await service.getRecentTransactions(1, 5);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { date: 'desc' },
        take: 5,
      });
    });
  });
});
