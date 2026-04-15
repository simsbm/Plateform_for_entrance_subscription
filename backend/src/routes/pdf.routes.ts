import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { prisma } from '../lib/prisma';
import { pdfService } from '../services/pdf.service';
import { fail } from '../types';

export const pdfRouter = Router();

pdfRouter.use(authenticate);

// GET /api/pdf/:candidatureId/fiche   — télécharger la fiche de candidature
// GET /api/pdf/:candidatureId/recepisse — télécharger le récépissé
async function downloadPdf(
  req: Request,
  res: Response,
  typePdf: 'FICHE_CANDIDATURE' | 'RECEPISSE',
) {
  const { candidatureId } = req.params;

  // Vérifie que le candidat accède à son propre dossier (ou admin/agent)
  const candidature = await prisma.candidature.findUnique({
    where: { id: candidatureId },
  });
  if (!candidature) {
    res.status(404).json(fail('Candidature introuvable'));
    return;
  }

  const isOwner = req.user!.role === 'CANDIDAT' && candidature.userId === req.user!.id;
  const isStaff  = req.user!.role === 'AGENT' || req.user!.role === 'ADMIN';
  if (!isOwner && !isStaff) {
    res.status(403).json(fail('Accès refusé'));
    return;
  }

  // Récupère ou (re)génère le PDF
  let pdf = await prisma.pDFGenere.findFirst({
    where: { candidatureId, type: typePdf },
  });

  if (!pdf || !fs.existsSync(pdf.cheminFichier)) {
    const filepath = typePdf === 'FICHE_CANDIDATURE'
      ? await pdfService.genererFicheCandidature(candidatureId)
      : await pdfService.genererRecepisse(candidatureId);

    pdf = await prisma.pDFGenere.findFirst({ where: { candidatureId, type: typePdf } });
    if (!pdf) {
      res.status(500).json(fail('Erreur lors de la génération du PDF'));
      return;
    }
  }

  // Marque comme téléchargé
  await prisma.pDFGenere.update({
    where: { id: pdf.id },
    data:  { telecharge: true },
  });

  res.download(pdf.cheminFichier, pdf.nomFichier);
}

pdfRouter.get('/:candidatureId/fiche',    (req, res) => downloadPdf(req, res, 'FICHE_CANDIDATURE'));
pdfRouter.get('/:candidatureId/recepisse', (req, res) => downloadPdf(req, res, 'RECEPISSE'));

// POST /api/pdf/:candidatureId/regenerer — forcer la régénération (ADMIN)
pdfRouter.post(
  '/:candidatureId/regenerer',
  requireRole('ADMIN'),
  async (req: Request, res: Response) => {
    const { candidatureId } = req.params;
    try {
      await Promise.all([
        pdfService.genererFicheCandidature(candidatureId),
        pdfService.genererRecepisse(candidatureId),
      ]);
      res.json({ success: true, message: 'PDFs régénérés avec succès' });
    } catch (err) {
      res.status(500).json(fail('Erreur lors de la régénération'));
    }
  }
);
