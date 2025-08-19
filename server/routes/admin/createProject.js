import express from 'express';
import { initDB } from '../../db.js';
import { authMiddleware } from '../../middleware/auth.js';
import slugify from 'slugify';


const router = express.Router();


router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body;


  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }


  const slug = slugify(name, { lower: true, strict: true });
  const db = await initDB();


  try {
    await db.run('INSERT INTO projects (name, slug) VALUES (?, ?)', [name, slug]);
    res.json({ success: true, name, slug });
  } catch (err) {
    console.error('❌ Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});


export default router;
