import express from 'express';
import { initDB } from '../../db.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const { projectSlug } = req.query;

  if (!projectSlug) {
    return res.status(400).json({ error: 'Missing projectSlug' });
  }

  const db = await initDB();

  try {
    const project = await db.get('SELECT id FROM projects WHERE slug = ?', [projectSlug]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const codes = await db.all(
      `SELECT id, code, discord_id, username, updated_at, redeemed
       FROM codes
       WHERE project_id = ?
       ORDER BY id DESC`,
      [project.id]
    );

    const formatted = codes.map(code => ({
      id: code.id,
      code: code.code,
      discord_id: code.discord_id,
      username: code.username,
      updated_at: code.updated_at,
      redeemed: Boolean(code.redeemed)
    }));

    const claimed = formatted.filter(c => c.redeemed).length;
    const unclaimed = formatted.length - claimed;
    const total = formatted.length;

    res.json({
      codes: formatted,
      claimed,
      unclaimed,
      total
    });

  } catch (err) {
    console.error('❌ Fetch codes error:', err);
    res.status(500).json({ error: 'Failed to fetch codes' });
  }
});

export default router;