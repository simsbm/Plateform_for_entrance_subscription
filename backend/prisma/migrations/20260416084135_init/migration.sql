-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CANDIDAT', 'AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "Filiere" AS ENUM ('ITT', 'IPT', 'TT', 'CPT', 'ITT_ALT', 'IPT_ALT', 'IT', 'APT');

-- CreateEnum
CREATE TYPE "StatutDossier" AS ENUM ('EN_ATTENTE', 'SOUMIS', 'DEPOSE', 'VALIDE', 'REJETE', 'ADMIS');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('ACTE_NAISSANCE', 'DIPLOME', 'PHOTO_IDENTITE', 'CNI');

-- CreateEnum
CREATE TYPE "TypePDF" AS ENUM ('FICHE_CANDIDATURE', 'RECEPISSE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CANDIDAT',
    "centreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidatures" (
    "id" TEXT NOT NULL,
    "numeroCandidat" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "lieuNaissance" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "nationalite" TEXT NOT NULL DEFAULT 'Camerounaise',
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "typeDiplome" TEXT NOT NULL,
    "serieBac" TEXT,
    "anneeObtention" INTEGER NOT NULL,
    "etablissement" TEXT NOT NULL,
    "filiere" "Filiere" NOT NULL,
    "montantPaye" INTEGER NOT NULL,
    "numeroRecuCampost" TEXT,
    "statut" "StatutDossier" NOT NULL DEFAULT 'EN_ATTENTE',
    "centreDepotId" TEXT,
    "dateDepot" TIMESTAMP(3),
    "agentId" TEXT,
    "dateValidation" TIMESTAMP(3),
    "motifRejet" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "candidatureId" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "cheminFichier" TEXT NOT NULL,
    "tailleFichier" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdfs_generes" (
    "id" TEXT NOT NULL,
    "candidatureId" TEXT NOT NULL,
    "type" "TypePDF" NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "cheminFichier" TEXT NOT NULL,
    "telecharge" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pdfs_generes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centres_depot" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "centres_depot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidatures_numeroCandidat_key" ON "candidatures"("numeroCandidat");

-- CreateIndex
CREATE UNIQUE INDEX "candidatures_userId_key" ON "candidatures"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "pdfs_generes_candidatureId_type_key" ON "pdfs_generes"("candidatureId", "type");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres_depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_centreDepotId_fkey" FOREIGN KEY ("centreDepotId") REFERENCES "centres_depot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_candidatureId_fkey" FOREIGN KEY ("candidatureId") REFERENCES "candidatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdfs_generes" ADD CONSTRAINT "pdfs_generes_candidatureId_fkey" FOREIGN KEY ("candidatureId") REFERENCES "candidatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
