import { Router } from 'express';
import { requireOnboarded, requireRole } from '../../middleware/auth';
import { getAlumniDashboard } from './alumni.service';

export const alumniRouter = Router();

alumniRouter.get('/alumni/dashboard', requireOnboarded, requireRole('ALUMNI'), async (req, res) => {
  res.json({ data: await getAlumniDashboard(req.user!) });
});
