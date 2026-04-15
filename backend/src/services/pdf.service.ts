import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { Candidature, CentreDepot } from '@prisma/client';
import { prisma } from '../lib/prisma';

const PDF_DIR = path.join(process.cwd(), 'pdfs');

// ─── Helpers de mise en page ───────────────────────────────────────────────────

const COLORS = {
  primary:   '#0A2A66',
  secondary: '#00AEEF',
  accent:    '#FF7A00',
  grey:      '#6B7280',
  lightGrey: '#F3F4F6',
  black:     '#1F2937',
};

function ensurePdfDir(candidatureId: string): string {
  const dir = path.join(PDF_DIR, candidatureId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function drawHeader(doc: PDFKit.PDFDocument, titre: string) {
  // Bande bleue principale
  doc.rect(0, 0, doc.page.width, 90).fill(COLORS.primary);

  // Titre de l'institution
  doc.fillColor('white')
     .font('Helvetica-Bold')
     .fontSize(11)
     .text("RÉPUBLIQUE DU CAMEROUN", 50, 20, { align: 'center' })
     .fontSize(9)
     .font('Helvetica')
     .text("Paix – Travail – Patrie", 50, 34, { align: 'center' })
     .moveDown(0.2)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text("MINISTÈRE DES POSTES ET TÉLÉCOMMUNICATIONS", 50, 46, { align: 'center' })
     .fontSize(9)
     .font('Helvetica')
     .text("École Nationale Supérieure des P&T et des TIC — SUP'PTIC", 50, 60, { align: 'center' });

  // Bande accent orange
  doc.rect(0, 90, doc.page.width, 6).fill(COLORS.accent);

  // Titre du document
  doc.fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .fontSize(14)
     .text(titre, 50, 112, { align: 'center' });

  doc.moveDown(0.5);
  doc.rect(50, doc.y, doc.page.width - 100, 1).fill(COLORS.secondary);
  doc.moveDown(1);
}

function drawSection(doc: PDFKit.PDFDocument, titre: string) {
  doc.moveDown(0.8);
  doc.rect(50, doc.y, doc.page.width - 100, 22).fill(COLORS.lightGrey);
  doc.fillColor(COLORS.primary)
     .font('Helvetica-Bold')
     .fontSize(10)
     .text(titre.toUpperCase(), 58, doc.y - 17);
  doc.moveDown(0.6);
}

function drawField(doc: PDFKit.PDFDocument, label: string, value: string, x = 58, inline = false) {
  if (inline) {
    doc.fillColor(COLORS.grey).font('Helvetica').fontSize(9).text(`${label} : `, x, doc.y, { continued: true });
    doc.fillColor(COLORS.black).font('Helvetica-Bold').text(value || '—');
  } else {
    doc.fillColor(COLORS.grey).font('Helvetica').fontSize(9).text(`${label} :`, x);
    doc.fillColor(COLORS.black).font('Helvetica-Bold').fontSize(10).text(value || '—', x + 10);
    doc.moveDown(0.3);
  }
}

function drawFooter(doc: PDFKit.PDFDocument) {
  const y = doc.page.height - 55;
  doc.rect(0, y, doc.page.width, 55).fill(COLORS.primary);
  doc.fillColor('white')
     .font('Helvetica')
     .fontSize(8)
     .text(
       "SUP'PTIC — Yaoundé, Cameroun  |  Tél : +237 222 XX XX XX  |  concours@supptic.cm",
       50, y + 10, { align: 'center' }
     )
     .text(
       `Document généré le ${new Date().toLocaleDateString('fr-FR', { dateStyle: 'long' })}`,
       50, y + 26, { align: 'center' }
     );
}

// ─── Libellés des filières ────────────────────────────────────────────────────

const FILIERE_LABELS: Record<string, string> = {
  ITT:     'ITT — Ingénieurs des Travaux des Télécommunications (Licence)',
  IPT:     'IPT — Inspecteurs des Postes et Télécommunications (Licence)',
  TT:      'TT — Techniciens des Télécommunications (Licence)',
  CPT:     'CPT — Contrôleurs des Postes et Télécommunications (Licence)',
  ITT_ALT: 'ITT — Alternance (Licence, Yaoundé)',
  IPT_ALT: 'IPT — Alternance (Licence, Yaoundé)',
  IT:      'IT — Ingénieurs des Télécommunications (Master)',
  APT:     'APT — Administrateurs des Postes et Télécommunications (Master)',
};

// ─── Service PDF ──────────────────────────────────────────────────────────────

export const pdfService = {

  // ── 1. Fiche de candidature ──────────────────────────────────────────────
  async genererFicheCandidature(candidatureId: string): Promise<string> {
    const candidature = await prisma.candidature.findUnique({
      where: { id: candidatureId },
      include: { centreDepot: true },
    });
    if (!candidature) throw new Error('Candidature introuvable');

    const dir      = ensurePdfDir(candidatureId);
    const filename = `fiche_candidature_${candidature.numeroCandidat}.pdf`;
    const filepath  = path.join(dir, filename);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // En-tête
      drawHeader(doc, `FICHE DE CANDIDATURE — CONCOURS ${new Date().getFullYear()}`);

      // Numéro candidat encadré
      doc.rect(50, doc.y, doc.page.width - 100, 32).stroke(COLORS.accent);
      doc.fillColor(COLORS.accent)
         .font('Helvetica-Bold')
         .fontSize(13)
         .text(`N° Candidat : ${candidature.numeroCandidat}`, 58, doc.y - 26, { align: 'center' });
      doc.moveDown(1.2);

      // Section 1 — Infos personnelles
      drawSection(doc, '1. Informations personnelles');
      const cols = doc.page.width / 2 - 60;
      const y0   = doc.y;
      drawField(doc, 'Nom',             candidature.nom,              58);
      drawField(doc, 'Prénom(s)',        candidature.prenom,           58);
      drawField(doc, 'Date de naissance', new Date(candidature.dateNaissance)
                  .toLocaleDateString('fr-FR'), 58);
      drawField(doc, 'Lieu de naissance', candidature.lieuNaissance,  58);
      // Colonne droite
      const rightX = 50 + cols + 20;
      doc.y = y0;
      drawField(doc, 'Région',          candidature.region,           rightX);
      drawField(doc, 'Ville',           candidature.ville,            rightX);
      drawField(doc, 'Nationalité',     candidature.nationalite,      rightX);
      drawField(doc, 'Téléphone',       candidature.telephone,        rightX);
      doc.moveDown(0.5);
      drawField(doc, 'Email',           candidature.email,            58);

      // Section 2 — Infos académiques
      drawSection(doc, '2. Informations académiques');
      drawField(doc, 'Type de diplôme',  candidature.typeDiplome);
      if (candidature.serieBac)
        drawField(doc, 'Série Bac',      candidature.serieBac);
      drawField(doc, 'Année d\'obtention', String(candidature.anneeObtention));
      drawField(doc, 'Établissement',    candidature.etablissement);

      // Section 3 — Concours
      drawSection(doc, '3. Filière et paiement');
      drawField(doc, 'Filière',         FILIERE_LABELS[candidature.filiere] ?? candidature.filiere);
      drawField(doc, 'Montant payé',    `${candidature.montantPaye.toLocaleString('fr-FR')} FCFA`);
      drawField(doc, 'N° Reçu CAMPOST', candidature.numeroRecuCampost ?? '—');

      // Section 4 — Centre de dépôt
      if (candidature.centreDepot) {
        drawSection(doc, '4. Centre de dépôt choisi');
        const c = candidature.centreDepot as CentreDepot;
        drawField(doc, 'Centre',  c.nom);
        drawField(doc, 'Ville',   c.ville);
        drawField(doc, 'Adresse', c.adresse ?? '—');
      }

      // Note de bas de section
      doc.moveDown(1);
      doc.rect(50, doc.y, doc.page.width - 100, 38).fill('#FFF7ED');
      doc.fillColor(COLORS.accent)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('IMPORTANT :', 60, doc.y - 30);
      doc.fillColor(COLORS.black)
         .font('Helvetica')
         .fontSize(8.5)
         .text(
           'Ce document doit être imprimé et déposé physiquement avec votre dossier complet au centre ci-dessus.',
           60, doc.y - 18, { width: doc.page.width - 120 }
         );

      drawFooter(doc);
      doc.end();
      stream.on('finish', resolve);
      stream.on('error',  reject);
    });

    // Enregistre la référence en base
    await prisma.pDFGenere.upsert({
      where: { candidatureId_type: { candidatureId, type: 'FICHE_CANDIDATURE' } } as any,
      create: { candidatureId, type: 'FICHE_CANDIDATURE', nomFichier: filename, cheminFichier: filepath },
      update: { nomFichier: filename, cheminFichier: filepath, generatedAt: new Date() },
    });

    return filepath;
  },

  // ── 2. Récépissé de dépôt (zone de signature agent) ─────────────────────
  async genererRecepisse(candidatureId: string): Promise<string> {
    const candidature = await prisma.candidature.findUnique({
      where: { id: candidatureId },
      include: { centreDepot: true },
    });
    if (!candidature) throw new Error('Candidature introuvable');

    const dir      = ensurePdfDir(candidatureId);
    const filename = `recepisse_${candidature.numeroCandidat}.pdf`;
    const filepath  = path.join(dir, filename);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      drawHeader(doc, `RÉCÉPISSÉ DE DÉPÔT DE DOSSIER — ${new Date().getFullYear()}`);

      // Avertissement valeur officielle
      doc.rect(50, doc.y, doc.page.width - 100, 28).fill('#FEF2F2');
      doc.fillColor('#B91C1C')
         .font('Helvetica-Bold')
         .fontSize(9)
         .text(
           '⚠  Ce récépissé n\'a de valeur officielle qu\'après signature et cachet de l\'agent habilité.',
           58, doc.y - 20, { width: doc.page.width - 116 }
         );
      doc.moveDown(1.2);

      // Numéro candidat
      doc.fillColor(COLORS.primary)
         .font('Helvetica-Bold')
         .fontSize(12)
         .text(`N° Candidat : ${candidature.numeroCandidat}`, { align: 'center' });
      doc.moveDown(0.8);

      // Identité
      drawSection(doc, 'Identité du candidat');
      drawField(doc, 'Nom et prénom(s)', `${candidature.nom} ${candidature.prenom}`);
      drawField(doc, 'Date de naissance', new Date(candidature.dateNaissance)
                  .toLocaleDateString('fr-FR'));
      drawField(doc, 'Filière',          FILIERE_LABELS[candidature.filiere] ?? candidature.filiere);
      drawField(doc, 'N° Reçu CAMPOST',  candidature.numeroRecuCampost ?? '—');
      drawField(doc, 'Montant',          `${candidature.montantPaye.toLocaleString('fr-FR')} FCFA`);

      // Centre de dépôt
      if (candidature.centreDepot) {
        drawSection(doc, 'Centre de dépôt');
        const c = candidature.centreDepot as CentreDepot;
        drawField(doc, 'Centre',  c.nom);
        drawField(doc, 'Ville',   c.ville);
        drawField(doc, 'Adresse', c.adresse ?? '—');
      }

      // Documents attendus
      drawSection(doc, 'Documents à vérifier');
      const docs = [
        '☐  Acte de naissance (original + copie)',
        '☐  Diplôme / Attestation (original + copie)',
        '☐  Photo d\'identité 4×4 (récente)',
        '☐  Carte Nationale d\'Identité (original + copie)',
        '☐  Reçu de paiement CAMPOST (original)',
        '☐  Fiche de candidature imprimée et signée',
      ];
      docs.forEach((line) => {
        doc.fillColor(COLORS.black).font('Helvetica').fontSize(10).text(line, 68);
        doc.moveDown(0.4);
      });

      // Zone de signature agent
      doc.moveDown(1.5);
      const sigY = doc.y;
      const pageW = doc.page.width;

      // Colonne gauche — date + signature agent
      doc.rect(50, sigY, (pageW - 120) / 2, 90).stroke(COLORS.grey);
      doc.fillColor(COLORS.grey)
         .font('Helvetica')
         .fontSize(9)
         .text("Date de réception :", 60, sigY + 8)
         .text("____ / ____ / ________", 60, sigY + 22)
         .text("Signature et cachet de l'agent :", 60, sigY + 40)
         .text("", 60, sigY + 55); // espace pour la signature

      // Colonne droite — signature candidat
      const rightSigX = 50 + (pageW - 120) / 2 + 20;
      doc.rect(rightSigX, sigY, (pageW - 120) / 2, 90).stroke(COLORS.grey);
      doc.fillColor(COLORS.grey)
         .font('Helvetica')
         .fontSize(9)
         .text("Signature du candidat :", rightSigX + 10, sigY + 8)
         .text("(Lu et approuvé)", rightSigX + 10, sigY + 22);

      drawFooter(doc);
      doc.end();
      stream.on('finish', resolve);
      stream.on('error',  reject);
    });

    await prisma.pDFGenere.upsert({
      where: { candidatureId_type: { candidatureId, type: 'RECEPISSE' } } as any,
      create: { candidatureId, type: 'RECEPISSE', nomFichier: filename, cheminFichier: filepath },
      update: { nomFichier: filename, cheminFichier: filepath, generatedAt: new Date() },
    });

    return filepath;
  },
};
