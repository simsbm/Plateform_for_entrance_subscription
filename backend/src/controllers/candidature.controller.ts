import { Request, Response } from 'express';
import { z } from 'zod';
import { Filiere } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ok, fail, MONTANTS_FILIERE, FILIERES_YAOUNDE_ONLY } from '../types';
import { pdfService } from '../services/pdf.service';

// ─── Validation Zod ────────────────────────────────────────────────────────────

const CandidatureSchema = z.object({
  // Infos personnelles
  nom:           z.string().min(2),
  prenom:        z.string().min(2),
  dateNaissance: z.string().transform((v) => new Date(v)),
  lieuNaissance: z.string().min(2),
  region:        z.string().min(2),
  ville:         z.string().min(2),
  nationalite:   z.string().optional().default('Camerounaise'),
  telephone:     z.string().min(9),
  email:         z.string().email(),

  // Infos personnelles complémentaires
  situationMatrimoniale: z.enum(['CELIBATAIRE', 'MARIE']).optional(),
  adresseAnneeScolaire:  z.string().optional(),

  // Filiation
  nomPere:         z.string().optional(),
  regionPere:      z.string().optional(),
  departementPere: z.string().optional(),
  nomMere:         z.string().optional(),
  regionMere:      z.string().optional(),
  departementMere: z.string().optional(),

  // Infos académiques
  typeDiplome:             z.enum(['BAC', 'GCE_AL', 'EQUIVALENT']),
  serieBac:                z.string().optional(),
  anneeObtention:          z.coerce.number().int().min(2000).max(new Date().getFullYear()),
  etablissement:           z.string().min(3),
  activitesExtraScolaires: z.string().optional(),

  // Concours
  filiere:           z.nativeEnum(Filiere),
  langueComposition: z.enum(['FRANCAIS', 'ANGLAIS']).optional(),

  // Paiement CAMPOST
  numeroRecuCampost: z.string().min(5, 'Numéro de reçu CAMPOST invalide'),

  // Centre de dépôt choisi
  centreDepotId: z.string().min(1, 'Centre de dépôt requis'),
});

// ─── Générateur de numéro candidat ────────────────────────────────────────────

async function genererNumeroCandidat(): Promise<string> {
  const annee = new Date().getFullYear();
  const count = await prisma.candidature.count();
  const seq = String(count + 1).padStart(5, '0');
  return `SUPP-${annee}-${seq}`;
}

// ─── Controllers ──────────────────────────────────────────────────────────────

// POST /api/candidatures  — soumettre une candidature (CANDIDAT)
export async function soumettreCandidature(req: Request, res: Response) {
  // Un candidat ne peut avoir qu'une seule candidature
  const existante = await prisma.candidature.findUnique({
    where: { userId: req.user!.id },
  });
  if (existante) {
    res.status(409).json(fail('Vous avez déjà soumis une candidature'));
    return;
  }

  const parsed = CandidatureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json(fail('Données invalides', parsed.error.flatten().fieldErrors));
    return;
  }

  const data = parsed.data;

  // Validation : filières Yaoundé uniquement
  if (FILIERES_YAOUNDE_ONLY.includes(data.filiere)) {
    const centre = await prisma.centreDepot.findUnique({ where: { id: data.centreDepotId } });
    if (!centre || centre.ville.toLowerCase() !== 'yaoundé') {
      res.status(400).json(fail(
        `La filière ${data.filiere} est accessible uniquement via le centre de Yaoundé`
      ));
      return;
    }
  }

  const montantPaye = MONTANTS_FILIERE[data.filiere];
  const numeroCandidat = await genererNumeroCandidat();

  const candidature = await prisma.candidature.create({
    data: {
      numeroCandidat,
      userId:                  req.user!.id,
      nom:                     data.nom,
      prenom:                  data.prenom,
      dateNaissance:           data.dateNaissance,
      lieuNaissance:           data.lieuNaissance,
      region:                  data.region,
      ville:                   data.ville,
      nationalite:             data.nationalite,
      telephone:               data.telephone,
      email:                   data.email,
      situationMatrimoniale:   data.situationMatrimoniale as any,
      adresseAnneeScolaire:    data.adresseAnneeScolaire,
      nomPere:                 data.nomPere,
      regionPere:              data.regionPere,
      departementPere:         data.departementPere,
      nomMere:                 data.nomMere,
      regionMere:              data.regionMere,
      departementMere:         data.departementMere,
      typeDiplome:             data.typeDiplome,
      serieBac:                data.serieBac,
      anneeObtention:          data.anneeObtention,
      etablissement:           data.etablissement,
      activitesExtraScolaires: data.activitesExtraScolaires,
      filiere:                 data.filiere,
      langueComposition:       data.langueComposition as any,
      montantPaye,
      numeroRecuCampost:       data.numeroRecuCampost,
      centreDepotId:           data.centreDepotId,
      statut:                  'SOUMIS',
    },
  });

  // Génération immédiate des 2 PDFs
  try {
    await pdfService.genererFicheCandidature(candidature.id);
    await pdfService.genererRecepisse(candidature.id);
  } catch (err) {
    console.error('[PDF] Erreur génération :', err);
    // On ne bloque pas la soumission — les PDFs peuvent être régénérés
  }

  res.status(201).json(ok({
    candidature: {
      id:            candidature.id,
      numeroCandidat,
      statut:        candidature.statut,
      filiere:       candidature.filiere,
      montantPaye,
    },
  }, 'Candidature soumise avec succès — vos PDFs sont disponibles dans votre espace'));
}

// GET /api/candidatures/me  — dashboard candidat
export async function getMaCandidature(req: Request, res: Response) {
  const candidature = await prisma.candidature.findUnique({
    where: { userId: req.user!.id },
    include: {
      documents:   { select: { id: true, type: true, nomFichier: true, uploadedAt: true } },
      pdfsGeneres: { select: { id: true, type: true, nomFichier: true, generatedAt: true, telecharge: true } },
      centreDepot: { select: { id: true, nom: true, ville: true, adresse: true, telephone: true } },
    },
  });

  if (!candidature) {
    res.status(404).json(fail('Aucune candidature trouvée'));
    return;
  }

  res.json(ok(candidature));
}

// POST /api/candidatures/:id/documents  — upload pièces (CANDIDAT)
export async function uploadDocuments(req: Request, res: Response) {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  if (!files || Object.keys(files).length === 0) {
    res.status(400).json(fail('Aucun fichier reçu'));
    return;
  }

  const candidature = await prisma.candidature.findFirst({
    where: { id: String(req.params.id), userId: req.user!.id },
  });
  if (!candidature) {
    res.status(404).json(fail('Candidature introuvable'));
    return;
  }

  const saves = Object.entries(files).map(([fieldname, [file]]) =>
    prisma.document.create({
      data: {
        candidatureId: candidature.id,
        type:          fieldname as any,
        nomFichier:    file.originalname,
        cheminFichier: file.path,
        tailleFichier: file.size,
        mimeType:      file.mimetype,
      },
    })
  );

  const documents = await Promise.all(saves);
  res.status(201).json(ok(documents, 'Documents téléversés avec succès'));
}

// GET /api/candidatures  — liste complète (ADMIN)
export async function listerCandidatures(req: Request, res: Response) {
  const { statut, filiere, region, page = '1', limit = '20' } = req.query;

  const where: Record<string, unknown> = {};
  if (statut)  where.statut  = statut;
  if (filiere) where.filiere = filiere;
  if (region)  where.region  = region;

  const skip = (Number(page) - 1) * Number(limit);

  const [candidatures, total] = await Promise.all([
    prisma.candidature.findMany({
      where,
      skip,
      take:    Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, numeroCandidat: true, nom: true, prenom: true,
        filiere: true, statut: true, region: true, montantPaye: true,
        createdAt: true,
        centreDepot: { select: { nom: true, ville: true } },
      },
    }),
    prisma.candidature.count({ where }),
  ]);

  res.json(ok({ candidatures, total, page: Number(page), limit: Number(limit) }));
}
