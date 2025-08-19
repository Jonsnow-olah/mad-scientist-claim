import express from 'express';
import fetch from 'node-fetch';
import { initDB } from '../db.js';

const router = express.Router();

// Discord OAuth config
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;

// STEP 1: Start OAuth
router.get('/start', (req, res) => {
  const { projectSlug } = req.query;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify',
    state: projectSlug || ''
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// STEP 2: Callback from Discord
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) return res.status(400).send('Missing code from Discord');

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('No access token');

    // Fetch Discord user info
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const user = await userRes.json();

    // Initialize database
    const db = await initDB();

    // Find all codes for this user in any project
    const codes = await db.all(`
      SELECT codes.*, projects.name AS projectName
      FROM codes
      LEFT JOIN projects ON codes.project_id = projects.id
      WHERE codes.redeemed = 0
      AND (codes.discord_id = ? OR codes.username = ?)
    `, [user.id, user.username]);

    if (!codes.length) {
      return sendPopupResponse(res, {
        success: false,
        message: `No unredeemed codes found for ${user.username}`,
        accessToken: tokenData.access_token
      });
    }

    // Prepare results without marking as redeemed
    const results = codes.map(codeRow => ({
      projectName: codeRow.projectName || 'Unknown',
      code: codeRow.code,
      id: codeRow.id // Include code ID for later redemption
    }));

    sendPopupResponse(res, {
      success: true,
      discordId: user.id,
      discordUsername: user.username,
      codes: results,
      accessToken: tokenData.access_token
    });

  } catch (err) {
    console.error('Discord OAuth Error:', err);
    sendPopupResponse(res, { success: false, message: 'OAuth failed' });
  }
});

// STEP 3: Revoke Token and Mark Codes as Redeemed
router.post('/revoke', async (req, res) => {
  const { accessToken, codeIds } = req.body;
  if (!accessToken) return res.status(400).json({ success: false, message: 'Missing access token' });

  try {
    // Revoke token
    await fetch('https://discord.com/api/oauth2/token/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        token: accessToken
      })
    });

    // Mark codes as redeemed
    if (codeIds && Array.isArray(codeIds) && codeIds.length > 0) {
      const db = await initDB();
      const placeholders = codeIds.map(() => '?').join(',');
      await db.run(
        `UPDATE codes SET redeemed = 1 WHERE id IN (${placeholders})`,
        codeIds
      );
    }

    res.json({ success: true, message: 'Token revoked and codes redeemed' });
  } catch (err) {
    console.error('Token Revocation Error:', err);
    res.status(500).json({ success: false, message: 'Failed to revoke token' });
  }
});

// Helper: HTML page that posts message to opener
function sendPopupResponse(res, data) {
  res.send(`
    <script>
      window.opener.postMessage(${JSON.stringify({ type: 'discord_auth', ...data })}, '*');
      window.close();
    </script>
  `);
}

export default router;