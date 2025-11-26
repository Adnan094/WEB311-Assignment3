// config/mongo.js
const mongoose = require('mongoose');
require('dotenv').config();

function connectMongo() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/web322';
  return mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

module.exports = { connectMongo };
