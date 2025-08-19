import { initDB } from '../../db.js';


export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }


  const { projectSlug } = req.query;


  if (!projectSlug) {
    return res.status(400).json({ error: 'Missing projectSlug' });
  }


  try {
    const db = await initDB();


    // Get the project ID
    const project = await db.get(
      'SELECT id FROM projects WHERE slug = ?',
      projectSlug
    );


    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }


    // Fetch all codes related to this project, including user info if available
    const codes = await db.all(
      `
      SELECT 
        codes.id,
        codes.code,
        codes.discord_id,
        codes.username,
        codes.redeemed,
        codes.updated_at
      FROM codes
      WHERE codes.project_id = ?
      `,
      project.id
    );


    // Count claimed and unclaimed codes
    const claimed = codes.filter(code => code.redeemed).length;
    const unclaimed = codes.filter(code => !code.redeemed).length;
    const total = codes.length;


    res.status(200).json({
      success: true,
      codes,
      claimed,
      unclaimed,
      total,
    });


  } catch (error) {
    console.error('Error in get-codes handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
