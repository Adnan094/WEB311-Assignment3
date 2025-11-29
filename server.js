// server.js
require('dotenv').config();
const { connectPostgres, sequelize } = require('./db'); // Postgres connection
const { connectMongo } = require('./config/mongo');    // Mongo connection
const app = require('./app');

async function start() {
  try {
    // Connect to Postgres
    await connectPostgres();
    console.log('Postgres connected');

    // Connect to Mongo
    await connectMongo();
    console.log('Mongo connected');

    // Sync Sequelize models
    await sequelize.sync();
    console.log('Sequelize models synced');

    // Start server locally
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server running locally at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

// Only run if called directly
if (require.main === module) {
  start();
}
