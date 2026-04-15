import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createApp } from './app';
import { prisma } from './lib/prisma';

const PORT = process.env.PORT ?? 3000;

// Crée les dossiers de stockage s'ils n'existent pas
for (const dir of ['uploads', 'pdfs']) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

async function main() {
  // Vérifie la connexion à la base de données
  await prisma.$connect();
  console.log('✅ Connecté à PostgreSQL');

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`🚀 Serveur SUP'PTIC démarré sur http://localhost:${PORT}`);
    console.log(`📋 Health check : http://localhost:${PORT}/health`);
    console.log(`🌍 Environnement : ${process.env.NODE_ENV ?? 'development'}`);
  });
}

main().catch(async (err) => {
  console.error('❌ Erreur au démarrage :', err);
  await prisma.$disconnect();
  process.exit(1);
});
