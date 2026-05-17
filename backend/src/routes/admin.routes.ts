import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { getAdminStats, getCandidatures, exportCandidatures } from '../controllers/admin.controller';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('ADMIN'));

adminRouter.get('/stats',                   getAdminStats);
adminRouter.get('/candidatures',            getCandidatures);
adminRouter.get('/candidatures/export',     exportCandidatures);
