import { connectPostgres, sequelize } from '../db';
import { connectMongo } from '../config/mongo';
import app from '../app';

let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected) {
    await connectPostgres();
    await connectMongo();
    await sequelize.sync();
    isConnected = true;
  }

  // Adapt Express to Vercel
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}
