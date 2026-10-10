import { Router } from 'express';
import {
  applicationRespondSchema,
  teamApplySchema,
  teamCreateSchema,
  teamListQuerySchema,
  teamUpdateSchema,
} from '@crossroads/shared';
import { requireOnboarded } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { writeLimiter } from '../../middleware/rateLimits';
import * as svc from './teams.service';

export const teamsRouter = Router();
teamsRouter.use('/teams', requireOnboarded);

teamsRouter.get('/teams', validate({ query: teamListQuerySchema }), async (req, res) => {
  res.json({ data: await svc.listTeams(req.user!.id, req.valid.query) });
});

// Declared before /teams/:id so "advisors" is not read as an id
teamsRouter.get('/teams/advisors', async (req, res) => {
  res.json({ data: await svc.listAdvisors(req.user!.id) });
});

teamsRouter.post('/teams', writeLimiter, validate({ body: teamCreateSchema }), async (req, res) => {
  res.status(201).json({ data: await svc.createTeam(req.user!.id, req.valid.body) });
});

teamsRouter.get('/teams/:id', async (req, res) => {
  res.json({ data: await svc.getTeam(req.user!.id, String(req.params.id)) });
});

teamsRouter.post('/teams/:id/apply', writeLimiter, validate({ body: teamApplySchema }), async (req, res) => {
  res.status(201).json({ data: await svc.applyToTeam(req.user!.id, String(req.params.id), req.valid.body.message) });
});

teamsRouter.post('/teams/:id/join', writeLimiter, async (req, res) => {
  res.status(201).json({ data: await svc.joinTeam(req.user!.id, String(req.params.id)) });
});

teamsRouter.patch(
  '/teams/:id/applications/:appId',
  validate({ body: applicationRespondSchema }),
  async (req, res) => {
    const data = await svc.respondApplication(
      req.user!.id,
      String(req.params.id),
      String(req.params.appId),
      req.valid.body.status,
    );
    res.json({ data });
  },
);

teamsRouter.patch('/teams/:id', validate({ body: teamUpdateSchema }), async (req, res) => {
  res.json({ data: await svc.setTeamStatus(req.user!.id, String(req.params.id), req.valid.body.status) });
});
