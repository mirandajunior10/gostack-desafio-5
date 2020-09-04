import { getRepository, getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: string;
  categoryName: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    categoryName,
  }: Request): Promise<Transaction> {
    const categoriesRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();
    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Value must be less than total balance', 400);
    }

    let category = await categoriesRepository.findOne({
      where: { title: categoryName },
    });

    if (!category) {
      category = categoriesRepository.create({
        title: categoryName,
      });
      await categoriesRepository.save(category);
    }

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Type must be income or outcome.', 400);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: category.id,
    });
    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
