import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { ok, fail } from '../types';

export const centresRouter = Router();

// GET /api/centres  — liste publique des centres actifs (pour le formulaire)
centresRouter.get('/', async (_req: Request, res: Response) => {
  const centres = await prisma.centreDepot.findMany({
    where:   { actif: true },
    orderBy: [{ region: 'asc' }, { ville: 'asc' }],
    select:  { id: true, nom: true, ville: true, region: true, adresse: true, telephone: true },
  });
  res.json(ok(centres));
});

// POST /api/centres  — créer un centre (ADMIN uniquement)
centresRouter.post('/', authenticate, requireRole('ADMIN'), async (req: Request, res: Response) => {
  const { nom, ville, region, adresse, telephone } = req.body;
  if (!nom || !ville || !region) {
    res.status(400).json(fail('Champs obligatoires : nom, ville, region'));
    return;
  }
  const centre = await prisma.centreDepot.create({
    data: { nom, ville, region, adresse, telephone },
  });
  res.status(201).json(ok(centre, 'Centre créé avec succès'));
});
