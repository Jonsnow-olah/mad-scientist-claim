import express from 'express';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { initDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
dotenv.config();
// eslint-disable-next-line no-undef
const JWT_SECRET = process.env.JWT_SECRET;

// Register new admin user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const db = await initDB();

  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: 'User exists or invalid' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const db = await initDB();

  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

// Protected route
router.get('/protected', authMiddleware, (req, res) => {
  res.json({
    message: `Hello, ${req.user.username}. You have access to this protected route.`,
  });
});

export default router;
