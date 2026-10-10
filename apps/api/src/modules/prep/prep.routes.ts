import { Router } from 'express';
import { requireOnboarded } from '../../middleware/auth';
import { getDashboard } from './prep.service';
import { validate } from '../../middleware/validate';
import { targetsSchema } from '@bridgeup/shared';
import { prisma } from '../../lib/prisma';

export const prepRouter = Router();

prepRouter.get('/dashboard', requireOnboarded, async (req, res) => {
  res.json({ data: await getDashboard(req.user!.id) });
});

prepRouter.put('/targets', requireOnboarded, validate({ body: targetsSchema }), async (req, res) => {
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { targetCompanies: req.valid.body.targetCompanies, targetRoles: req.valid.body.targetRoles }
  });
  res.json({ data: updated });
});
