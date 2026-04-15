import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { TypeDocument } from '@prisma/client';

const MAX_SIZE_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

const ACCEPTED_MIME: Record<TypeDocument, string[]> = {
  ACTE_NAISSANCE: ['application/pdf', 'image/jpeg', 'image/png'],
  DIPLOME:        ['application/pdf', 'image/jpeg', 'image/png'],
  PHOTO_IDENTITE: ['image/jpeg', 'image/png'],
  CNI:            ['application/pdf', 'image/jpeg', 'image/png'],
};

const storage = multer.diskStorage({
  destination(req: Request, _file, cb) {
    // Stocke dans uploads/<candidatureId>/
    const candidatureId = req.params.id ?? 'temp';
    const dir = path.join(process.cwd(), 'uploads', candidatureId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = file.fieldname; // ex. "ACTE_NAISSANCE"
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) {
  const docType = file.fieldname as TypeDocument;
  const allowed = ACCEPTED_MIME[docType] ?? [];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Type MIME non autorisé pour le champ ${docType}`));
  }
}

export const uploadDocuments = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
}).fields([
  { name: 'ACTE_NAISSANCE', maxCount: 1 },
  { name: 'DIPLOME',        maxCount: 1 },
  { name: 'PHOTO_IDENTITE', maxCount: 1 },
  { name: 'CNI',            maxCount: 1 },
]);
