// routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { preventLoggedInAccess } = require('../middleware/auth');

const router = express.Router();
const SALT = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

// GET Register
router.get('/register', preventLoggedInAccess, (req, res) => {
  res.render('register', { error: null });
});

// POST Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.render('register', { error: "All fields required" });

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists)
      return res.render('register', { error: "Username or email already exists" });

    const hash = await bcrypt.hash(password, SALT);
    const user = new User({ username, email, password: hash });
    await user.save();

    req.session.user = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email
    };

    res.redirect('/dashboard');
  } catch (err) {
    res.render('register', { error: "Registration failed" });
  }
});

// GET Login
router.get('/login', preventLoggedInAccess, (req, res) => {
  res.render('login', { error: null });
});

// POST Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.render('login', { error: "Email & password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.render('login', { error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: "Invalid credentials" });

    req.session.user = {
      userId: user._id.toString(),
      username: user.username,
      email: user.email
    };

    res.redirect('/dashboard');
  } catch (err) {
    res.render('login', { error: "Login failed" });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/login');
});

module.exports = router;
