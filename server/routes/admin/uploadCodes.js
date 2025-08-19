import express from 'express';
import { initDB } from '../../db.js';
import { authMiddleware } from '../../middleware/auth.js';


const router = express.Router();


router.post('/', authMiddleware, async (req, res) => {
  const { projectSlug, codes } = req.body;


  if (!projectSlug || !codes || !Array.isArray(codes)) {
    return res.status(400).json({ error: 'projectSlug and codes[] are required' });
  }


  const db = await initDB();


  try {
    let project = await db.get('SELECT id FROM projects WHERE slug = ?', [projectSlug]);


    if (!project) {
      await db.run(
        'INSERT INTO projects (name, slug) VALUES (?, ?)',
        [projectSlug, projectSlug]
      );
      project = await db.get('SELECT id FROM projects WHERE slug = ?', [projectSlug]);
    } 


    // Prepare insert statement
    const insertStmt = await db.prepare(`
      INSERT INTO codes (code, discord_id, username, redeemed, updated_at, project_id)
      VALUES (?, ?, ?, ?, datetime('now'), ?)
    `);


    // Insert each code entry
    for (const entry of codes) {
      const { code, discordId, discordUsername } = entry;
      await insertStmt.run(code, discordId || null, discordUsername || null, 0, project.id);
    }


    await insertStmt.finalize();


    res.json({ message: `Uploaded ${codes.length} codes to project "${projectSlug}"` });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ error: 'Failed to upload codes' });
  }
});


export default router;
