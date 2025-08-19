import express from 'express';
import { initDB } from '../../db.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  return res.status(501).json({ error: 'Redeem route disabled due to redundancy with mark-used' });
});

export default router;