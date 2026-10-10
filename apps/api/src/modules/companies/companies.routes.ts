import { Router } from 'express';
import { companyListQuerySchema, experienceFilterSchema } from '@bridgeup/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as svc from './companies.service';

export const companiesRouter = Router();

companiesRouter.get('/companies', requireOnboarded, validate({ query: companyListQuerySchema }), async (req, res) => {
  res.json({ data: await svc.listCompanies(req.valid.query.q) });
});

companiesRouter.get('/companies/:slug', requireOnboarded, async (req, res) => {
  res.json({ data: await svc.getCompany(String(req.params.slug), req.user!.id) });
});

companiesRouter.get(
  '/companies/:slug/experiences',
  requireOnboarded,
  validate({ query: experienceFilterSchema }),
  async (req, res) => {
    res.json({ data: await svc.listExperiences(String(req.params.slug), req.user!.id, req.valid.query) });
  },
);

companiesRouter.get('/companies/:slug/alumni', requireOnboarded, async (req, res) => {
  res.json({ data: await svc.companyAlumni(String(req.params.slug), req.user!.id) });
});
