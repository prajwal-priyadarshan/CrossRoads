import { Router } from 'express';
import { z } from 'zod';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { targetsSchema, prepItemSchema, prepItemUpdateSchema } from '@crossroads/shared';
import { prisma } from '../../lib/prisma';
import { getDashboard, createPrepItem, updatePrepItem, deletePrepItem, importPrepItems } from './prep.service';

export const prepRouter = Router();

prepRouter.get('/dashboard', requireOnboarded, async (req, res) => {
  res.json({ data: await getDashboard(req.user!.id) });
});

prepRouter.put('/targets', requireOnboarded, validate({ body: targetsSchema }), async (req, res) => {
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data: { targetCompanies: req.valid.body.targetCompanies, targetRoles: req.valid.body.targetRoles },
    select: { targetCompanies: true, targetRoles: true },
  });
  res.json({ data: updated });
});

prepRouter.post('/items', requireOnboarded, validate({ body: prepItemSchema }), async (req, res) => {
  res.status(201).json({ data: await createPrepItem(req.user!.id, req.valid.body) });
});

prepRouter.post('/items/import', requireOnboarded, validate({ body: z.object({ companyId: z.string().uuid() }) }), async (req, res) => {
  res.json({ data: await importPrepItems(req.user!.id, req.valid.body.companyId) });
});

prepRouter.patch('/items/:id', requireOnboarded, validate({ body: prepItemUpdateSchema }), async (req, res) => {
  res.json({ data: await updatePrepItem(req.user!.id, String(req.params.id), req.valid.body) });
});

prepRouter.delete('/items/:id', requireOnboarded, async (req, res) => {
  await deletePrepItem(req.user!.id, String(req.params.id));
  res.json({ data: { deleted: true } });
});
