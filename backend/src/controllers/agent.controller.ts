import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ok, fail } from '../types';

// ─── Schémas de validation ─────────────────────────────────────────────────────

const ValiderSchema = z.object({
  statut: z.enum(['VALIDE', 'REJETE']),
  motifRejet: z.string().min(10, 'Le motif doit faire au moins 10 caractères').optional(),
}).refine(
  (d) => d.statut !== 'REJETE' || !!d.motifRejet,
  { message: 'Le motif de rejet est obligatoire', path: ['motifRejet'] }
);

// ─── Controllers ──────────────────────────────────────────────────────────────

// GET /api/agent/dossiers
// Liste les dossiers du centre de l'agent (statut SOUMIS par défaut)
export async function getDossiersDuCentre(req: Request, res: Response) {
  const agent = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!agent?.centreId) {
    res.status(400).json(fail("Vous n'êtes affecté à aucun centre de dépôt"));
    return;
  }

  const { statut = 'SOUMIS', page = '1', limit = '20' } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const [dossiers, total] = await Promise.all([
    prisma.candidature.findMany({
      where: {
        centreDepotId: agent.centreId,
        statut: statut as any,
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        numeroCandidat: true,
        nom: true,
        prenom: true,
        filiere: true,
        statut: true,
        montantPaye: true,
        numeroRecuCampost: true,
        dateDepot: true,
        documents: { select: { id: true, type: true, nomFichier: true } },
      },
    }),
    prisma.candidature.count({
      where: { centreDepotId: agent.centreId, statut: statut as any },
    }),
  ]);

  res.json(ok({ dossiers, total, page: Number(page), limit: Number(limit) }));
}

// GET /api/agent/dossiers/:id
// Détail complet d'un dossier pour vérification par l'agent
export async function getDossierDetail(req: Request, res: Response) {
  const agent = await prisma.user.findUnique({ where: { id: req.user!.id } });

  const dossier = await prisma.candidature.findFirst({
    where: {
      id: String(req.params.id),
      centreDepotId: agent?.centreId ?? undefined,
    },
    include: {
      documents:   true,
      pdfsGeneres: true,
      centreDepot: true,
    },
  });

  if (!dossier) {
    res.status(404).json(fail('Dossier introuvable ou hors de votre centre'));
    return;
  }

  res.json(ok(dossier));
}

// PATCH /api/agent/dossiers/:id/valider
// L'agent valide ou rejette directement un dossier SOUMIS lors du dépôt physique
export async function validerDossier(req: Request, res: Response) {
  const parsed = ValiderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail('Données invalides', parsed.error.flatten().fieldErrors));
    return;
  }

  const dossier = await prisma.candidature.findUnique({ where: { id: String(req.params.id) } });

  if (!dossier) {
    res.status(404).json(fail('Dossier introuvable'));
    return;
  }
  if (dossier.statut !== 'SOUMIS') {
    res.status(400).json(fail(`Statut actuel "${dossier.statut}" — seul un dossier SOUMIS peut être validé ou rejeté`));
    return;
  }

  const { statut, motifRejet } = parsed.data;

  const updated = await prisma.candidature.update({
    where: { id: String(req.params.id) },
    data: {
      statut,
      agentId:        req.user!.id,
      dateValidation: new Date(),
      dateDepot:      new Date(),
      motifRejet:     statut === 'REJETE' ? motifRejet : null,
    },
    select: {
      id: true, numeroCandidat: true, nom: true, prenom: true,
      statut: true, motifRejet: true, dateValidation: true,
    },
  });

  const msg = statut === 'VALIDE'
    ? 'Dossier validé avec succès'
    : `Dossier rejeté — motif : ${motifRejet}`;

  res.json(ok(updated, msg));
}

// GET /api/agent/stats
// Statistiques du centre pour le tableau de bord agent
export async function getStatsCentre(req: Request, res: Response) {
  const agent = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!agent?.centreId) {
    res.status(400).json(fail("Vous n'êtes affecté à aucun centre de dépôt"));
    return;
  }

  const [enAttente, soumis, valides, rejetes] = await Promise.all([
    prisma.candidature.count({ where: { centreDepotId: agent.centreId, statut: 'EN_ATTENTE' } }),
    prisma.candidature.count({ where: { centreDepotId: agent.centreId, statut: 'SOUMIS' } }),
    prisma.candidature.count({ where: { centreDepotId: agent.centreId, statut: 'VALIDE' } }),
    prisma.candidature.count({ where: { centreDepotId: agent.centreId, statut: 'REJETE' } }),
  ]);

  res.json(ok({ enAttente, soumis, valides, rejetes }));
}
