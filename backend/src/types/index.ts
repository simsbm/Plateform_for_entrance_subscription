import { Filiere } from '@prisma/client';

// ─── Montants par filière (décisions ministérielles 2025) ─────────────────────
export const MONTANTS_FILIERE: Record<Filiere, number> = {
  // Licence — session principale
  ITT: 15000,
  IPT: 15000,
  TT:  15000,
  CPT: 15000,
  // Licence — alternance (Yaoundé uniquement)
  ITT_ALT: 20000,
  IPT_ALT: 20000,
  // Master (Yaoundé uniquement)
  IT:  25000,
  APT: 25000,
};

/// Filières accessibles uniquement depuis Yaoundé
export const FILIERES_YAOUNDE_ONLY: Filiere[] = ['ITT_ALT', 'IPT_ALT', 'IT', 'APT'];

// ─── Extensions de Express Request avec user JWT ──────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: import('@prisma/client').Role;
      };
    }
  }
}

// ─── Réponse API standard ─────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function fail(message: string, errors?: Record<string, string[]>): ApiResponse {
  return { success: false, message, errors };
}
