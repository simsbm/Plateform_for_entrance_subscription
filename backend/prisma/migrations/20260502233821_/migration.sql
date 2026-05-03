/*
  Warnings:

  - The values [DEPOSE] on the enum `StatutDossier` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "LangueComposition" AS ENUM ('FRANCAIS', 'ANGLAIS');

-- CreateEnum
CREATE TYPE "SituationMatrimoniale" AS ENUM ('CELIBATAIRE', 'MARIE');

-- AlterEnum
BEGIN;
CREATE TYPE "StatutDossier_new" AS ENUM ('EN_ATTENTE', 'SOUMIS', 'VALIDE', 'REJETE', 'ADMIS');
ALTER TABLE "candidatures" ALTER COLUMN "statut" DROP DEFAULT;
ALTER TABLE "candidatures" ALTER COLUMN "statut" TYPE "StatutDossier_new" USING ("statut"::text::"StatutDossier_new");
ALTER TYPE "StatutDossier" RENAME TO "StatutDossier_old";
ALTER TYPE "StatutDossier_new" RENAME TO "StatutDossier";
DROP TYPE "StatutDossier_old";
ALTER TABLE "candidatures" ALTER COLUMN "statut" SET DEFAULT 'EN_ATTENTE';
COMMIT;

-- AlterTable
ALTER TABLE "candidatures" ADD COLUMN     "activitesExtraScolaires" TEXT,
ADD COLUMN     "adresseAnneeScolaire" TEXT,
ADD COLUMN     "departementMere" TEXT,
ADD COLUMN     "departementPere" TEXT,
ADD COLUMN     "langueComposition" "LangueComposition",
ADD COLUMN     "nomMere" TEXT,
ADD COLUMN     "nomPere" TEXT,
ADD COLUMN     "regionMere" TEXT,
ADD COLUMN     "regionPere" TEXT,
ADD COLUMN     "situationMatrimoniale" "SituationMatrimoniale";
