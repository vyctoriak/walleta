export type Intent =
  | 'create_transaction'
  | 'get_balance'
  | 'get_report'
  | 'needs_clarification'
  | 'unknown';

export interface TransactionData {
  amount: number;
  category: string;
  description: string | null;
  date: string | null;
}

export interface PeriodData {
  month: number | null;
  year: number | null;
}

export interface ParsedTransactionMessage {
  intent: 'create_transaction';
  transactions: TransactionData[];
}

export interface ParsedBalanceMessage {
  intent: 'get_balance';
  period: PeriodData;
}

export interface ParsedReportMessage {
  intent: 'get_report';
  period: PeriodData;
}

export interface ParsedClarificationMessage {
  intent: 'needs_clarification';
  clarification: string;
}

export interface ParsedUnknownMessage {
  intent: 'unknown';
  message: string;
}

export type ParsedMessage =
  | ParsedTransactionMessage
  | ParsedBalanceMessage
  | ParsedReportMessage
  | ParsedClarificationMessage
  | ParsedUnknownMessage;
