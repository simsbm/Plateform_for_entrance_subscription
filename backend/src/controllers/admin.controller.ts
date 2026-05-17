import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ok } from '../types';

// GET /api/admin/stats
export async function getAdminStats(_req: Request, res: Response) {
  const [total, parStatut, parFiliere, parRegion, montantResult, derniersInscrits] =
    await Promise.all([
      prisma.candidature.count(),

      prisma.candidature.groupBy({
        by: ['statut'],
        _count: { statut: true },
      }),

      prisma.candidature.groupBy({
        by: ['filiere'],
        _count: { filiere: true },
        orderBy: { _count: { filiere: 'desc' } },
      }),

      prisma.candidature.groupBy({
        by: ['region'],
        _count: { region: true },
        orderBy: { _count: { region: 'desc' } },
      }),

      prisma.candidature.aggregate({
        _sum: { montantPaye: true },
      }),

      prisma.candidature.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          numeroCandidat: true,
          nom: true,
          prenom: true,
          filiere: true,
          statut: true,
          region: true,
          createdAt: true,
        },
      }),
    ]);

  const statutMap = Object.fromEntries(
    parStatut.map(s => [s.statut, s._count.statut])
  );

  res.json(ok({
    total,
    parStatut: {
      EN_ATTENTE: statutMap['EN_ATTENTE'] ?? 0,
      SOUMIS:     statutMap['SOUMIS']     ?? 0,
      VALIDE:     statutMap['VALIDE']     ?? 0,
      REJETE:     statutMap['REJETE']     ?? 0,
      ADMIS:      statutMap['ADMIS']      ?? 0,
    },
    parFiliere: parFiliere.map(f => ({ filiere: f.filiere, count: f._count.filiere })),
    parRegion:  parRegion.map(r  => ({ region:  r.region,  count: r._count.region  })),
    montantTotal: montantResult._sum.montantPaye ?? 0,
    derniersInscrits,
  }));
}

// GET /api/admin/candidatures?page&limit&search&region&filiere&statut
export async function getCandidatures(req: Request, res: Response) {
  const {
    page    = '1',
    limit   = '20',
    search  = '',
    region  = '',
    filiere = '',
    statut  = '',
  } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { nom:            { contains: search, mode: 'insensitive' } },
      { prenom:         { contains: search, mode: 'insensitive' } },
      { numeroCandidat: { contains: search, mode: 'insensitive' } },
      { email:          { contains: search, mode: 'insensitive' } },
    ];
  }
  if (region)  where.region  = region;
  if (filiere) where.filiere = filiere;
  if (statut)  where.statut  = statut;

  const skip = (Number(page) - 1) * Number(limit);

  const [candidatures, total] = await Promise.all([
    prisma.candidature.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id:             true,
        numeroCandidat: true,
        nom:            true,
        prenom:         true,
        email:          true,
        telephone:      true,
        region:         true,
        filiere:        true,
        statut:         true,
        montantPaye:    true,
        createdAt:      true,
        centreDepot: { select: { nom: true, ville: true } },
      },
    }),
    prisma.candidature.count({ where }),
  ]);

  res.json(ok({ candidatures, total, page: Number(page), limit: Number(limit) }));
}

// GET /api/admin/candidatures/export?region&filiere&statut
export async function exportCandidatures(req: Request, res: Response) {
  const { region = '', filiere = '', statut = '' } = req.query as Record<string, string>;

  const where: Record<string, unknown> = {};
  if (region)  where.region  = region;
  if (filiere) where.filiere = filiere;
  if (statut)  where.statut  = statut;

  const candidatures = await prisma.candidature.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      numeroCandidat:    true,
      nom:               true,
      prenom:            true,
      email:             true,
      telephone:         true,
      region:            true,
      filiere:           true,
      statut:            true,
      montantPaye:       true,
      typeDiplome:       true,
      anneeObtention:    true,
      etablissement:     true,
      langueComposition: true,
      createdAt:         true,
      centreDepot: { select: { nom: true, ville: true } },
    },
  });

  const headers = [
    'Numéro Candidat', 'Nom', 'Prénom', 'Email', 'Téléphone',
    'Région', 'Filière', 'Statut', 'Montant Payé (FCFA)',
    'Type Diplôme', 'Année Obtention', 'Établissement',
    'Langue Composition', 'Centre de Dépôt', 'Date Inscription',
  ];

  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = candidatures.map(c => [
    c.numeroCandidat, c.nom, c.prenom, c.email, c.telephone,
    c.region, c.filiere, c.statut, c.montantPaye,
    c.typeDiplome, c.anneeObtention, c.etablissement,
    c.langueComposition ?? '',
    c.centreDepot ? `${c.centreDepot.nom} (${c.centreDepot.ville})` : '',
    new Date(c.createdAt).toLocaleDateString('fr-FR'),
  ].map(escape).join(','));

  const csv      = [headers.join(','), ...rows].join('\n');
  const filename = `candidats-supptic-${new Date().toISOString().slice(0, 10)}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('﻿' + csv);
}
