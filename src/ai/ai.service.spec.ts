import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

const mockCreate = jest.fn();
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('fake-groq-api-key'),
};

function groqResponse(content: string | null) {
  return {
    choices: [{ message: { content } }],
  };
}

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);

    jest.clearAllMocks();
  });

  describe('parseMessage — create_transaction', () => {
    it('deve parsear uma transação simples', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'create_transaction',
            transactions: [
              { amount: 50, category: 'alimentação', description: 'mercado', date: null },
            ],
          }),
        ),
      );

      const result = await service.parseMessage('Gastei 50 no mercado');

      expect(result.intent).toBe('create_transaction');
      if (result.intent === 'create_transaction') {
        expect(result.transactions).toHaveLength(1);
        expect(result.transactions[0].amount).toBe(50);
        expect(result.transactions[0].category).toBe('alimentação');
        expect(result.transactions[0].description).toBe('mercado');
      }
    });

    it('deve parsear múltiplas transações', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'create_transaction',
            transactions: [
              { amount: 35, category: 'transporte', description: 'uber', date: null },
              { amount: 8, category: 'alimentação', description: 'café', date: null },
            ],
          }),
        ),
      );

      const result = await service.parseMessage('Uber 35, café 8');

      expect(result.intent).toBe('create_transaction');
      if (result.intent === 'create_transaction') {
        expect(result.transactions).toHaveLength(2);
      }
    });

    it('deve retornar fallback quando transactions está vazio', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'create_transaction',
            transactions: [],
          }),
        ),
      );

      const result = await service.parseMessage('algo');

      expect(result.intent).toBe('unknown');
    });

    it('deve retornar fallback quando amount é inválido', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'create_transaction',
            transactions: [
              { amount: -10, category: 'alimentação', description: 'teste', date: null },
            ],
          }),
        ),
      );

      const result = await service.parseMessage('algo');

      expect(result.intent).toBe('unknown');
    });

    it('deve retornar fallback quando category está vazia', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'create_transaction',
            transactions: [
              { amount: 50, category: '', description: 'teste', date: null },
            ],
          }),
        ),
      );

      const result = await service.parseMessage('algo');

      expect(result.intent).toBe('unknown');
    });
  });

  describe('parseMessage — get_balance', () => {
    it('deve parsear consulta de saldo com período', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'get_balance',
            period: { month: 3, year: 2026 },
          }),
        ),
      );

      const result = await service.parseMessage('Quanto gastei em março?');

      expect(result.intent).toBe('get_balance');
      if (result.intent === 'get_balance') {
        expect(result.period.month).toBe(3);
        expect(result.period.year).toBe(2026);
      }
    });

    it('deve retornar period null quando não especificado', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'get_balance',
            period: {},
          }),
        ),
      );

      const result = await service.parseMessage('Qual meu saldo?');

      expect(result.intent).toBe('get_balance');
      if (result.intent === 'get_balance') {
        expect(result.period.month).toBeNull();
        expect(result.period.year).toBeNull();
      }
    });
  });

  describe('parseMessage — get_report', () => {
    it('deve parsear pedido de relatório', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'get_report',
            period: { month: 3, year: null },
          }),
        ),
      );

      const result = await service.parseMessage('Resumo de março');

      expect(result.intent).toBe('get_report');
      if (result.intent === 'get_report') {
        expect(result.period.month).toBe(3);
      }
    });
  });

  describe('parseMessage — needs_clarification', () => {
    it('deve retornar clarification quando mensagem é ambígua', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'needs_clarification',
            clarification: 'Quanto você gastou no mercado? 🤔',
          }),
        ),
      );

      const result = await service.parseMessage('Gastei no mercado');

      expect(result.intent).toBe('needs_clarification');
      if (result.intent === 'needs_clarification') {
        expect(result.clarification).toContain('mercado');
      }
    });

    it('deve usar fallback de clarification quando campo ausente', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'needs_clarification',
          }),
        ),
      );

      const result = await service.parseMessage('hmm');

      expect(result.intent).toBe('needs_clarification');
      if (result.intent === 'needs_clarification') {
        expect(result.clarification).toBeTruthy();
      }
    });
  });

  describe('parseMessage — unknown', () => {
    it('deve retornar unknown para mensagens não financeiras', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(
          JSON.stringify({
            intent: 'unknown',
            message: 'Oi! Sou a Walleta 💜',
          }),
        ),
      );

      const result = await service.parseMessage('Bom dia!');

      expect(result.intent).toBe('unknown');
      if (result.intent === 'unknown') {
        expect(result.message).toContain('Walleta');
      }
    });
  });

  describe('parseMessage — tratamento de erros', () => {
    it('deve retornar fallback quando Groq retorna resposta vazia', async () => {
      mockCreate.mockResolvedValue(groqResponse(null));

      const result = await service.parseMessage('qualquer coisa');

      expect(result.intent).toBe('unknown');
    });

    it('deve retornar fallback quando Groq retorna JSON inválido', async () => {
      mockCreate.mockResolvedValue(groqResponse('isso não é json'));

      const result = await service.parseMessage('qualquer coisa');

      expect(result.intent).toBe('unknown');
    });

    it('deve retornar fallback quando Groq retorna JSON sem intent', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(JSON.stringify({ foo: 'bar' })),
      );

      const result = await service.parseMessage('qualquer coisa');

      expect(result.intent).toBe('unknown');
    });

    it('deve retornar fallback quando Groq retorna intent desconhecido', async () => {
      mockCreate.mockResolvedValue(
        groqResponse(JSON.stringify({ intent: 'delete_everything' })),
      );

      const result = await service.parseMessage('qualquer coisa');

      expect(result.intent).toBe('unknown');
    });

    it('deve retornar fallback quando Groq API lança erro (timeout/network)', async () => {
      mockCreate.mockRejectedValue(new Error('Request timeout'));

      const result = await service.parseMessage('qualquer coisa');

      expect(result.intent).toBe('unknown');
    });

    it('deve retornar fallback quando Groq API lança erro genérico', async () => {
      mockCreate.mockRejectedValue(new Error('Internal Server Error'));

      const result = await service.parseMessage('qualquer coisa');

      expect(result.intent).toBe('unknown');
      if (result.intent === 'unknown') {
        expect(result.message).toBeTruthy();
      }
    });
  });
});
