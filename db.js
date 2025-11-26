// db.js (PostgreSQL / Sequelize)
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.PG_DATABASE || 'web322',
  process.env.PG_USER || 'postgres',
  process.env.PG_PASSWORD || '',
  {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Test connection
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected successfully!'))
  .catch(err => console.error('Postgres connection error:', err));

module.exports = sequelize;
