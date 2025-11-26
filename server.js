/********************************************************************************
* WEB322 – Assignment 03
*
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
*
* https://www.senecapolytechnic.ca/about/policies/academic-integrity-policy.html
*
* Name: ____AdnanKhan__________________ Student ID: _131485245_____________ Date: __23-11-2025____________
*
********************************************************************************/

require('dotenv').config();
const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const clientSessions = require('client-sessions');
const mongoose = require('mongoose');

const db = require('./db'); // sequelize (Postgres)
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// static
app.use(express.static(path.join(__dirname, 'public')));

// body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// sessions
app.use(clientSessions({
  cookieName: 'session',
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  duration: 30 * 60 * 1000, // 30 minutes
  activeDuration: 5 * 60 * 1000,
  httpOnly: true,
  secure: false
}));

// make session user available in views
app.use((req, res, next) => {
  res.locals.user = req.session && req.session.user ? req.session.user : null;
  next();
});

// connect to MongoDB (users)
const { connectMongo } = require('./config/mongo');
connectMongo()
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// routes
app.use('/', authRoutes);
app.use('/', taskRoutes);

// root
app.get('/', (req, res) => {
  if (!req.session || !req.session.user) return res.redirect('/login');
  res.redirect('/dashboard');
});

// start server after syncing Postgres models
db.sync()
  .then(() => {
    console.log('Sequelize models synced');
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Postgres sync error:', err);
    process.exit(1);
  });
