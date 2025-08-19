import express from 'express';
import { initDB } from '../../db.js';

const router = express.Router();
const CLAIM_COOLDOWN_MINUTES = 2;

router.post('/', async (req, res) => {
  return res.status(501).json({ error: 'Claim route disabled due to schema mismatch' });
  /*
  const { discordId, projectSlug, username } = req.body;

  if (!discordId || !projectSlug || !username) {
    return res.status(400).json({ error: 'discordId, projectSlug, and username are required' });
  }

  const db = await initDB();

  try {
    const project = await db.get('SELECT id FROM projects WHERE slug = ?', [projectSlug]);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const now = new Date();
    const recentClaim = await db.get(
      `SELECT updated_at FROM codes
       WHERE discord_id = ? AND project_id = ?
       ORDER BY updated_at DESC LIMIT 1`,
      [discordId, project.id]
    );

    if (recentClaim) {
      const lastUpdated = new Date(recentClaim.updated_at);
      const diffMs = now - lastUpdated;
      const diffMin = diffMs / (1000 * 60);
      if (diffMin < CLAIM_COOLDOWN_MINUTES) {
        return res.status(429).json({ error: 'Please wait before claiming again.' });
      }
    }

    const codeEntry = await db.get(
      `SELECT * FROM codes
       WHERE discord_id IS NULL AND claimed = 0 AND redeemed = 0 AND project_id = ?
       ORDER BY RANDOM() LIMIT 1`,
      [project.id]
    );

    if (!codeEntry) return res.status(404).json({ error: 'No available codes left.' });

    await db.run(
      `UPDATE codes
       SET discord_id = ?, username = ?, claimed = 1, updated_at = ?
       WHERE id = ?`,
      [discordId, username, now.toISOString(), codeEntry.id]
    );

    res.json({ code: codeEntry.code });
  } catch (err) {
    console.error('Claim error:', err);
    res.status(500).json({ error: 'Failed to claim code' });
  }
  */
});

export default router;