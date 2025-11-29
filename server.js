/********************************************************************************
* WEB322 – Assignment 03
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: ______________________ Student ID: ______________ Date: ______________
*
********************************************************************************/

require('dotenv').config();
const { connectPostgres, sequelize } = require('./db'); // postgres connection helpers
const { connectMongo } = require('./config/mongo');
const app = require('./app');

async function start() {
  try {
    // Connect Postgres
    await connectPostgres();

    // Connect Mongo
    await connectMongo();

    // Sync Sequelize models
    await sequelize.sync();
    console.log('Sequelize models synced');

    // Start HTTP server
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();
