import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import multer from 'multer';

// import DeleteTransactionService from '../services/DeleteTransactionService';
// import ImportTransactionsService from '../services/ImportTransactionsService';
import CreateTransactionService from '../services/CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';
import uploadConfig from '../config/upload';
import Transaction from '../models/Transaction';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  // TODO
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  const balance = await transactionsRepository.getBalance();
  const transactions = await transactionsRepository.find();
  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;
  const createTransaction = new CreateTransactionService();
  const transaction = await createTransaction.execute({
    title,
    value,
    type,
    categoryName: category,
  });

  return response.json(transaction);
});

transactionsRouter.delete('/:id', async (request, response) => {
  // TODO
  const { id } = request.params;
  const transactionsRepository = getCustomRepository(TransactionsRepository);
  await transactionsRepository.delete(id);
  return response.status(204).json({});
});

async function loadCSV(filePath: string): Promise<unknown[]> {
  const readCSVStream = fs.createReadStream(filePath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readCSVStream.pipe(parseStream);

  const lines: unknown[] = [];

  parseCSV.on('data', line => {
    lines.push(line);
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  return lines;
}

transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    // TODO

    const lines = await loadCSV(request.file.path);
    const transactions: Transaction[] = [];

    for (let i = 0; i < lines.length; i++) {
      const [title, type, value, category] = lines[i] as [
        string,
        string,
        number,
        string,
      ];
      const createTransaction = new CreateTransactionService();
      const transaction = await createTransaction.execute({
        title,
        value,
        type,
        categoryName: category,
      });
      transactions.push(transaction);
    }

    return response.json(transactions);
  },
);

export default transactionsRouter;
