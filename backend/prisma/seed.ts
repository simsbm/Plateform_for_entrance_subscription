/**
 * Seed initial — SUP'PTIC
 * Lance avec : npm run db:seed
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...\n');

  // ─── 1. Centres de dépôt habilités ────────────────────────────────────────
  const centres = await Promise.all([
    prisma.centreDepot.upsert({
      where:  { id: 'centre-yaounde' },
      update: {},
      create: {
        id:        'centre-yaounde',
        nom:       "SUP'PTIC — Site principal",
        ville:     'Yaoundé',
        region:    'Centre',
        adresse:   'Avenue Monseigneur Vogt, Yaoundé',
        telephone: '+237 222 22 22 22',
      },
    }),
    prisma.centreDepot.upsert({
      where:  { id: 'centre-douala' },
      update: {},
      create: {
        id:        'centre-douala',
        nom:       'Délégation Régionale MINPOSTEL Littoral',
        ville:     'Douala',
        region:    'Littoral',
        adresse:   'Boulevard de la Liberté, Douala',
        telephone: '+237 233 33 33 33',
      },
    }),
    prisma.centreDepot.upsert({
      where:  { id: 'centre-bafoussam' },
      update: {},
      create: {
        id:        'centre-bafoussam',
        nom:       'Délégation Régionale MINPOSTEL Ouest',
        ville:     'Bafoussam',
        region:    'Ouest',
        adresse:   'Rue de l\'Indépendance, Bafoussam',
        telephone: '+237 233 44 44 44',
      },
    }),
    prisma.centreDepot.upsert({
      where:  { id: 'centre-garoua' },
      update: {},
      create: {
        id:        'centre-garoua',
        nom:       'Délégation Régionale MINPOSTEL Nord',
        ville:     'Garoua',
        region:    'Nord',
        adresse:   'Avenue de la République, Garoua',
        telephone: '+237 222 55 55 55',
      },
    }),
    prisma.centreDepot.upsert({
      where:  { id: 'centre-buea' },
      update: {},
      create: {
        id:        'centre-buea',
        nom:       'Délégation Régionale MINPOSTEL Sud-Ouest',
        ville:     'Buea',
        region:    'Sud-Ouest',
        adresse:   'Molyko, Buea',
        telephone: '+237 233 66 66 66',
      },
    }),
  ]);
  console.log(`✅ ${centres.length} centres de dépôt créés`);

  // ─── 2. Comptes utilisateurs (admin + agents + candidat démo) ─────────────
  const hash = (pwd: string) => bcrypt.hashSync(pwd, 12);

  // Admin
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@supptic.cm' },
    update: {},
    create: {
      email:        'admin@supptic.cm',
      passwordHash: hash('Admin@2026!'),
      role:         'ADMIN',
    },
  });

  // Agents (un par centre principal)
  const agentYde = await prisma.user.upsert({
    where:  { email: 'agent.yaounde@supptic.cm' },
    update: {},
    create: {
      email:        'agent.yaounde@supptic.cm',
      passwordHash: hash('Agent@2026!'),
      role:         'AGENT',
      centreId:     'centre-yaounde',
    },
  });

  const agentDla = await prisma.user.upsert({
    where:  { email: 'agent.douala@supptic.cm' },
    update: {},
    create: {
      email:        'agent.douala@supptic.cm',
      passwordHash: hash('Agent@2026!'),
      role:         'AGENT',
      centreId:     'centre-douala',
    },
  });

  // Candidat de démonstration
  const candidatDemo = await prisma.user.upsert({
    where:  { email: 'eli.eyango@demo.cm' },
    update: {},
    create: {
      email:        'eli.eyango@demo.cm',
      passwordHash: hash('Candidat@2026!'),
      role:         'CANDIDAT',
    },
  });

  console.log(`✅ Comptes créés : admin, ${agentYde.email}, ${agentDla.email}, candidat démo`);

  // ─── 3. Candidature démo (statut SOUMIS) ──────────────────────────────────
  const dejaExiste = await prisma.candidature.findUnique({
    where: { userId: candidatDemo.id },
  });

  if (!dejaExiste) {
    await prisma.candidature.create({
      data: {
        numeroCandidat:    'SUPP-2026-00001',
        userId:            candidatDemo.id,
        nom:               'EYANGO',
        prenom:            'Eli',
        dateNaissance:     new Date('2000-03-15'),
        lieuNaissance:     'Yaoundé',
        region:            'Centre',
        ville:             'Yaoundé',
        nationalite:       'Camerounaise',
        telephone:         '+237 699 00 00 01',
        email:             'eli.eyango@demo.cm',
        typeDiplome:       'BAC',
        serieBac:          'C',
        anneeObtention:    2022,
        etablissement:     'Lycée Général Leclerc',
        filiere:           'ITT',
        montantPaye:       15000,
        numeroRecuCampost: 'CAMP-2026-987654',
        centreDepotId:     'centre-yaounde',
        statut:            'SOUMIS',
      },
    });
    console.log('✅ Candidature démo créée (SUPP-2026-00001 — statut SOUMIS)');
  } else {
    console.log('ℹ️  Candidature démo déjà présente, ignorée');
  }

  // ─── Résumé ───────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────');
  console.log("🎉 Seed terminé !\n");
  console.log("  Comptes de connexion :");
  console.log("  ┌─────────────────────────────────┬──────────────────┬──────────┐");
  console.log("  │ Email                           │ Mot de passe     │ Rôle     │");
  console.log("  ├─────────────────────────────────┼──────────────────┼──────────┤");
  console.log("  │ admin@supptic.cm                │ Admin@2026!      │ ADMIN    │");
  console.log("  │ agent.yaounde@supptic.cm        │ Agent@2026!      │ AGENT    │");
  console.log("  │ agent.douala@supptic.cm         │ Agent@2026!      │ AGENT    │");
  console.log("  │ eli.eyango@demo.cm              │ Candidat@2026!   │ CANDIDAT │");
  console.log("  └─────────────────────────────────┴──────────────────┴──────────┘");
  console.log('─────────────────────────────────────────────\n');
}

main()
  .catch((e) => { console.error('❌ Erreur seed :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
