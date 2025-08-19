import express from 'express';
import { initDB } from '../../db.js';
import { authMiddleware } from '../../middleware/auth.js';


const router = express.Router();


router.get('/', authMiddleware, async (req, res) => {
  const db = await initDB();
  try {
    const projects = await db.all('SELECT name, slug FROM projects ORDER BY id DESC');
    res.json({ projects });
  } catch (err) {
    console.error('❌ Fetch projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// DELETE LOGIC


router.delete('/', authMiddleware, async (req, res) => {
  const slug = req.query.slug;
  if (!slug) {
    return res.status(400).json({ error: 'Project slug is required' });
  }


  try {
    const db = await initDB();


    // Get the project ID from the slug
    const project = await db.get('SELECT id FROM projects WHERE slug = ?', [slug]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }


    const projectId = project.id;


    // Delete related rows from other tables
    await db.run('DELETE FROM codes WHERE project_id = ?', [projectId]);
    await db.run('DELETE FROM content WHERE project_id = ?', [projectId]);


    // Delete the project
    await db.run('DELETE FROM projects WHERE id = ?', [projectId]);


    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting project:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



export default router;
