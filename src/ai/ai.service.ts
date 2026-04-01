import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import {
  FINANCE_PARSER_SYSTEM_PROMPT,
  buildUserPrompt,
} from './prompts/finance-parser.prompt';
import { ParsedMessage } from './interfaces/parsed-message.interface';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly groq: Groq;
  private readonly model = 'llama-3.3-70b-versatile';

  constructor(private readonly configService: ConfigService) {
    this.groq = new Groq({
      apiKey: this.configService.getOrThrow<string>('GROQ_API_KEY'),
    });
  }

  async parseMessage(userInput: string): Promise<ParsedMessage> {
    try {
      const chatCompletion = await this.groq.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: FINANCE_PARSER_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: buildUserPrompt(userInput),
          },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      });

      const content = chatCompletion.choices[0]?.message?.content;

      if (!content) {
        this.logger.warn('Groq retornou resposta vazia');
        return this.fallbackUnknown();
      }

      return this.parseAndValidate(content);
    } catch (error) {
      this.logger.error('Erro ao chamar Groq API', error);
      return this.fallbackUnknown();
    }
  }

  private parseAndValidate(raw: string): ParsedMessage {
    try {
      const parsed = JSON.parse(raw);

      if (!parsed.intent) {
        this.logger.warn('Resposta sem intent', raw);
        return this.fallbackUnknown();
      }

      switch (parsed.intent) {
        case 'create_transaction':
          if (!Array.isArray(parsed.transactions) || parsed.transactions.length === 0) {
            this.logger.warn('create_transaction sem transactions válidas', raw);
            return this.fallbackUnknown();
          }
          for (const t of parsed.transactions) {
            if (typeof t.amount !== 'number' || t.amount <= 0) {
              this.logger.warn('Transação com amount inválido', t);
              return this.fallbackUnknown();
            }
            if (typeof t.category !== 'string' || !t.category) {
              this.logger.warn('Transação sem category', t);
              return this.fallbackUnknown();
            }
          }
          return {
            intent: 'create_transaction',
            transactions: parsed.transactions.map((t: Record<string, unknown>) => ({
              amount: t.amount as number,
              category: t.category as string,
              description: (t.description as string) ?? null,
              date: (t.date as string) ?? null,
            })),
          };

        case 'get_balance':
          return {
            intent: 'get_balance',
            period: {
              month: parsed.period?.month ?? null,
              year: parsed.period?.year ?? null,
            },
          };

        case 'get_report':
          return {
            intent: 'get_report',
            period: {
              month: parsed.period?.month ?? null,
              year: parsed.period?.year ?? null,
            },
          };

        case 'needs_clarification':
          return {
            intent: 'needs_clarification',
            clarification: parsed.clarification ?? 'Pode repetir de outra forma? 🤔',
          };

        case 'unknown':
          return {
            intent: 'unknown',
            message:
              parsed.message ??
              'Oi! Sou a Walleta 💜 Me conta um gasto ou pede um resumo do mês!',
          };

        default:
          this.logger.warn(`Intent desconhecido: ${parsed.intent}`, raw);
          return this.fallbackUnknown();
      }
    } catch {
      this.logger.error('Falha ao parsear JSON da resposta Groq', raw);
      return this.fallbackUnknown();
    }
  }

  private fallbackUnknown(): ParsedMessage {
    return {
      intent: 'unknown',
      message: 'Hmm, não entendi 😅 Tenta me mandar algo como "Gastei 50 no mercado" 💜',
    };
  }
}