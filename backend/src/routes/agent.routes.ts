import { Router } from 'express';
import {
  getDossiersDuCentre,
  getDossierDetail,
  validerDossier,
  getStatsCentre,
} from '../controllers/agent.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

export const agentRouter = Router();

agentRouter.use(authenticate, requireRole('AGENT', 'ADMIN'));

agentRouter.get('/stats',                  getStatsCentre);
agentRouter.get('/dossiers',               getDossiersDuCentre);
agentRouter.get('/dossiers/:id',           getDossierDetail);
agentRouter.patch('/dossiers/:id/valider', validerDossier);
