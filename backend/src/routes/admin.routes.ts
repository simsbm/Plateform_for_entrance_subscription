import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import {
  getAdminStats, getCandidatures, exportCandidatures,
  getEvolution, getCandidatureDetail, updateStatut,
} from '../controllers/admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('ADMIN'));

adminRouter.get('/stats',                        getAdminStats);
adminRouter.get('/stats/evolution',              getEvolution);
adminRouter.get('/candidatures',                 getCandidatures);
adminRouter.get('/candidatures/export',          exportCandidatures);
adminRouter.get('/candidatures/:id',             getCandidatureDetail);
adminRouter.patch('/candidatures/:id/statut',    updateStatut);
