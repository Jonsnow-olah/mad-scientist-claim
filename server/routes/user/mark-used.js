import express from 'express';
import { initDB } from '../../db.js';
import { authMiddleware } from '../../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { project_slug, code, discord_id } = req.body;

  if (!project_slug || !code || !discord_id) {
    return res.status(400).json({ error: 'project_slug, code, and discord_id are required' });
  }

  const db = await initDB();

  try {
    const project = await db.get('SELECT id FROM projects WHERE slug = ?', [project_slug]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const existing_code = await db.get(
      'SELECT * FROM codes WHERE code = ? AND project_id = ?',
      [code, project.id]
    );

    if (!existing_code) {
      return res.status(404).json({ error: 'Code not found in project' });
    }

    if (existing_code.used_by) {
      return res.status(400).json({ error: 'Code has already been used' });
    }

    await db.run(
      `UPDATE codes
       SET used_by = ?,
           used_at = CURRENT_TIMESTAMP
       WHERE code = ? AND project_id = ?`,
      [discord_id, code, project.id]
    );

    res.json({ message: 'Code marked as used successfully' });
  } catch (err) {
    console.error('Mark-used error:', err);
    res.status(500).json({ error: 'Failed to mark code as used' });
  }
});

export default router;