export class CreateTransactionDto {
  userId: number;
  amount: number;
  category: string;
  description?: string;
  date?: Date;
}
