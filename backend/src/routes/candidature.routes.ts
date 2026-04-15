import { Router } from 'express';
import {
  soumettreCandidature,
  getMaCandidature,
  uploadDocuments,
  listerCandidatures,
} from '../controllers/candidature.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { uploadDocuments as uploadMiddleware } from '../middlewares/upload.middleware';

export const candidatureRouter = Router();

// Toutes les routes nécessitent une authentification
candidatureRouter.use(authenticate);

// CANDIDAT
candidatureRouter.post('/',            requireRole('CANDIDAT'), soumettreCandidature);
candidatureRouter.get('/me',           requireRole('CANDIDAT'), getMaCandidature);
candidatureRouter.post('/:id/documents', requireRole('CANDIDAT'), uploadMiddleware, uploadDocuments);

// ADMIN
candidatureRouter.get('/', requireRole('ADMIN'), listerCandidatures);
