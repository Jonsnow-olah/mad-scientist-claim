import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import uploadCodes from './routes/admin/uploadCodes.js';
import claimRoute from './routes/user/claim.js';
import adminGetCodes from './routes/admin/get-codes.js';
import markUsedRoute from './routes/user/mark-used.js';
import createProjectRoute from './routes/admin/createProject.js';
import projectsRoute from './routes/admin/projects.js';
import codesRoute from './routes/admin/codes.js';
import redeemRoute from './routes/user/redeem.js';
import discordClaimRoute from './routes/discordClaim.js';
import discordRoute from './routes/discord.js';
import { initDB } from './db.js';
import rateLimit from 'express-rate-limit';


const app = express();
const PORT = 3001;


app.use(cors());
app.use(express.json());


// Apply rate limiting only to critical user-facing routes
const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Stricter limit for abuse-prone endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
});


initDB().then(() => {
  app.use('/api/auth', authRoutes);
  app.use('/api/admin/upload-codes', uploadCodes);
  app.use('/api/claim', userRateLimiter, claimRoute); 
  app.use('/api/admin/get-codes', adminGetCodes);
  app.use('/api/mark-used', userRateLimiter, markUsedRoute); 
  app.use('/api/admin/create-project', createProjectRoute);
  app.use('/api/admin/projects', projectsRoute);
  app.use('/api/admin/codes', codesRoute);
  app.use('/api/redeem', userRateLimiter, redeemRoute); 
  app.use('/api/discordClaim', discordClaimRoute);
  app.use('/api/discord', discordRoute);

  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize DB:', err);
});
