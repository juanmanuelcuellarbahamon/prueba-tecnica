import { IsInt, IsEnum, Min } from 'class-validator';

export class FundsWithdrawDto {
  @IsInt()
  @Min(1)
  accountId: number;

  @Min(0.01)
  amount: number;

  @IsEnum(['COP', 'USD', 'EUR'])
  currency: 'COP' | 'USD' | 'EUR';
}