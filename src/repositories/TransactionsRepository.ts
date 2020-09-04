import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find();
    const balance = transactions.reduce((acc, transaction) => {
      if (!acc.income) acc.income = 0;
      if (!acc.outcome) acc.outcome = 0;

      if (transaction.type === 'income') {
        acc.income += transaction.value;
      }
      if (transaction.type === 'outcome') {
        acc.outcome += transaction.value;
      }

      return acc;
    }, {} as Balance);

    balance.total = balance.income - balance.outcome;
    if (!balance.total) {
      return { income: 0, outcome: 0, total: 0 };
    }
    return balance;
  }
}

export default TransactionsRepository;
