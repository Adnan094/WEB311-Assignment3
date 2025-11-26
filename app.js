// app.js
require('dotenv').config();
const express = require('express');
const session = require('client-sessions');
const path = require('path');
const bcrypt = require('bcrypt');
const expressLayouts = require('express-ejs-layouts');

// Database connections
const sequelize = require('./db');
const Task = require('./models/task');
const { connectMongo } = require('./config/mongo');

// Middleware
const { requireLogin } = require('./middleware/auth');

const app = express();

// Body parser & static files
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// EJS Layouts
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Session config
app.use(
  session({
    cookieName: 'session',
    secret: process.env.SESSION_SECRET || 'AnyRandomSecret',
    duration: 30 * 60 * 1000,
    activeDuration: 5 * 60 * 1000
  })
);

// Expose logged-in user to all EJS views
app.use((req, res, next) => {
  if (req.session && req.session.userId) {
    res.locals.user = {
      username: req.session.username,
      email: req.session.email
    };
  } else {
    res.locals.user = null;
  }
  next();
});

// Connect MongoDB then load routes
connectMongo()
  .then(() => {
    console.log('MongoDB connected successfully!');
    const User = require('./models/user');

    // -------------------------
    // AUTH ROUTES
    // -------------------------

    app.get('/register', (req, res) => {
      res.render('register', { error: null });
    });

    app.post('/register', async (req, res) => {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.render('register', { error: 'All fields are required.' });
      }

      if (password.length < 6) {
        return res.render('register', { error: 'Password must be at least 6 characters.' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.render('register', { error: 'Invalid email address.' });
      }

      try {
        const existingUser = await User.findOne({
          $or: [{ email }, { username }]
        });

        if (existingUser) {
          return res.render('register', {
            error: 'Username or Email already exists'
          });
        }

        const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
        const hashedPassword = await bcrypt.hash(password, rounds);

        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.redirect('/login');
      } catch (err) {
        console.error('Registration error:', err);

        if (err.code === 11000) {
          return res.render('register', {
            error: 'Username or Email already exists'
          });
        }

        res.render('register', { error: 'Registration failed.' });
      }
    });

    app.get('/login', (req, res) => {
      res.render('login', { error: null });
    });

    app.post('/login', async (req, res) => {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.render('login', {
          error: 'Email and password are required'
        });
      }

      try {
        const user = await User.findOne({ email });

        if (!user) {
          return res.render('login', { error: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return res.render('login', { error: 'Invalid credentials' });
        }

        // Create session
        req.session.userId = user._id.toString();
        req.session.username = user.username;
        req.session.email = user.email;

        res.redirect('/dashboard');
      } catch (err) {
        console.error('Login error:', err);
        res.render('login', { error: 'Login failed' });
      }
    });

    app.get('/logout', (req, res) => {
      req.session.reset();
      res.redirect('/login');
    });

    // -------------------------
    // DASHBOARD
    // -------------------------

    app.get('/', (req, res) => {
      if (!req.session.userId) return res.redirect('/login');
      res.redirect('/dashboard');
    });

    app.get('/dashboard', requireLogin, async (req, res) => {
      try {
        const tasks = await Task.findAll({
          where: { userId: req.session.userId.toString() }
        });

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'pending').length;

        res.render('dashboard', { total, completed, pending });
      } catch (err) {
        console.error('Dashboard error:', err);
        res.send('Error loading dashboard');
      }
    });

    // -------------------------
    // TASKS ROUTES
    // -------------------------

    // List tasks
    app.get('/tasks', requireLogin, async (req, res) => {
      try {
        const tasks = await Task.findAll({
          where: { userId: req.session.userId.toString() }
        });
        res.render('tasks', { tasks });
      } catch (err) {
        console.error('Tasks list error:', err);
        res.send('Error loading tasks');
      }
    });

    // Add new task (form)
    app.get('/tasks/add', requireLogin, (req, res) => {
      res.render('task_form', {
        task: null,
        action: '/tasks/add',
        error: null
      });
    });

    // Add task (submit)
    app.post('/tasks/add', requireLogin, async (req, res) => {
      const { title, description, dueDate, status } = req.body;

      if (!title || title.trim() === '') {
        return res.render('task_form', {
          task: null,
          action: '/tasks/add',
          error: 'Title is required'
        });
      }

      try {
        await Task.create({
          title: title.trim(),
          description,
          dueDate: dueDate || null,
          status: status || 'pending',
          userId: req.session.userId.toString()
        });

        res.redirect('/tasks');
      } catch (err) {
        console.error('Add task error:', err);

        res.render('task_form', {
          task: null,
          action: '/tasks/add',
          error: 'Failed to add task'
        });
      }
    });

    // Edit form
    app.get('/tasks/edit/:id', requireLogin, async (req, res) => {
      try {
        const task = await Task.findByPk(req.params.id);

        if (!task || task.userId !== req.session.userId.toString()) {
          return res.redirect('/tasks');
        }

        res.render('task_form', {
          task,
          action: `/tasks/edit/${task.id}`,
          error: null
        });
      } catch (err) {
        console.error('Edit form error:', err);
        res.redirect('/tasks');
      }
    });

    // Edit submit
    app.post('/tasks/edit/:id', requireLogin, async (req, res) => {
      const { title, description, dueDate, status } = req.body;

      try {
        const task = await Task.findByPk(req.params.id);

        if (!task || task.userId !== req.session.userId.toString()) {
          return res.redirect('/tasks');
        }

        await task.update({
          title: title.trim(),
          description,
          dueDate: dueDate || null,
          status
        });

        res.redirect('/tasks');
      } catch (err) {
        console.error('Edit submit error:', err);

        res.render('task_form', {
          task: { id: req.params.id, title, description, dueDate, status },
          action: `/tasks/edit/${req.params.id}`,
          error: 'Failed to update task'
        });
      }
    });

    // Delete task
    app.post('/tasks/delete/:id', requireLogin, async (req, res) => {
      try {
        const task = await Task.findByPk(req.params.id);

        if (task && task.userId === req.session.userId.toString()) {
          await Task.destroy({ where: { id: req.params.id } });
        }

        res.redirect('/tasks');
      } catch (err) {
        console.error('Delete error:', err);
        res.redirect('/tasks');
      }
    });

    // Toggle task status
    app.post('/tasks/status/:id', requireLogin, async (req, res) => {
      try {
        const task = await Task.findByPk(req.params.id);

        if (!task || task.userId !== req.session.userId.toString()) {
          return res.redirect('/tasks');
        }

        task.status = task.status === 'pending' ? 'completed' : 'pending';
        await task.save();

        res.redirect('/tasks');
      } catch (err) {
        console.error('Status toggle error:', err);
        res.redirect('/tasks');
      }
    });

    // -------------------------
    // START SERVER
    // -------------------------

    sequelize
      .sync()
      .then(() => {
        const port = process.env.PORT || 3000;
        app.listen(port, () =>
          console.log(`Server running at http://localhost:${port}`)
        );
      })
      .catch(err => console.error('PostgreSQL sync error:', err));
  })
  .catch(err => console.error('MongoDB connection error:', err));
