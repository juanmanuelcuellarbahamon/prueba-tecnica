import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankAccount } from './entity/bank-account.entity';
import { Transaction } from './entity/transaction.entity';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { User } from '../auth/entity/user.entity';

@Injectable()
export class BankAccountService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createBankAccountDto: CreateBankAccountDto): Promise<BankAccount> {
    const newAccount = this.bankAccountRepository.create(createBankAccountDto);
    return await this.bankAccountRepository.save(newAccount);
  }

  async findByUserId(userId: number): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({
      where: { userId },
    });
  }

  async findAll(): Promise<BankAccount[]> {
    return this.bankAccountRepository.find();
  }

  private async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async getAccountById(accountId: number): Promise<BankAccount> {
    const account = await this.bankAccountRepository.findOne({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  private async processFundsForUser(
    amount: number,
    userId: number,
    type: 'Deposit' | 'Withdrawal',
    currency: 'USD' | 'COP' | 'EUR',
    accountId: number, // Default to 0 for user-level operations
  ): Promise<{ message: string; newBalance: number }> {
    if (amount <= 0) {
      throw new BadRequestException(
        `${type === 'Deposit' ? 'Deposit amount' : 'Withdrawal amount'} must be greater than zero`,
      );
    }

    // Fetch and validate the user
    const user = await this.getUserById(userId);

    let balanceKey: keyof Pick<User, 'balanceUSD' | 'balanceCOP' | 'balanceEUR'>;

    switch (currency) {
      case 'USD':
        balanceKey = 'balanceUSD';
        break;
      case 'COP':
        balanceKey = 'balanceCOP';
        break;
      case 'EUR':
        balanceKey = 'balanceEUR';
        break;
      default:
        throw new BadRequestException('Invalid currency');
    }

    const previousBalance = Number(user[balanceKey]);

    // Check for sufficient balance for withdrawals
    if (type === 'Withdrawal' && previousBalance < amount) {
      throw new BadRequestException('Insufficient funds');
    }

    // Perform the deposit or withdrawal
    const newBalance =
      type === 'Deposit'
        ? previousBalance + amount
        : previousBalance - amount;

    user[balanceKey] = newBalance;

    // Save the updated user balance
    await this.userRepository.save(user);

    // Create a transaction record
    const transaction = this.transactionRepository.create({
      type,
      amount,
      previousBalance,
      newBalance,
      userId,
      accountId, // Use the provided accountId (default is 0 for user-level operations)
      currency,
      createdAt: new Date(),
    });

    await this.transactionRepository.save(transaction);

    return {
      message: `${type === 'Deposit' ? 'Deposit' : 'Withdrawal'} successful`,
      newBalance,
    };
  }

  async addFundsToUser(
    amount: number,
    userId: number,
    currency: 'USD' | 'COP' | 'EUR',
  ): Promise<{ message: string; newBalance: number }> {
    return this.processFundsForUser(amount, userId, 'Deposit', currency, 0);
  }

  async withdrawFundsFromUser(
    amount: number,
    userId: number,
    currency: 'USD' | 'COP' | 'EUR',
    accountId: number
  ): Promise<{ message: string; newBalance: number }> {
    return this.processFundsForUser(amount, userId, 'Withdrawal', currency, accountId); // Use accountId: 0 for user-level withdrawals
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTransactionsByAccountId(accountId: number): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserBalance(userId: number): Promise<{ balanceUSD: number; balanceCOP: number; balanceEUR: number }> {
    const user = await this.getUserById(userId);

    return {
      balanceUSD: user.balanceUSD,
      balanceCOP: user.balanceCOP,
      balanceEUR: user.balanceEUR,
    };
  }
}