import axios from 'axios';

// ─── Clés localStorage ────────────────────────────────────────────────────────
export const TOKEN_KEY = 'supptic_token';
export const ROLE_KEY  = 'supptic_role';

// ─── Helpers auth ─────────────────────────────────────────────────────────────
export function saveAuth(token: string, role: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole(): string | null {
  return localStorage.getItem(ROLE_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ─── Instance axios ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Intercepteur requête : injecte le JWT si présent
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur réponse : gère les 401 → redirect login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Types réponse API ────────────────────────────────────────────────────────
export interface ApiOk<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiOk<T> | ApiError;

// ─── Endpoints auth ───────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  role: 'CANDIDAT' | 'AGENT' | 'ADMIN';
}

export interface AuthPayload {
  user: AuthUser;
  token: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiOk<AuthPayload>>('/auth/login', { email, password }),

  register: (email: string, password: string) =>
    api.post<ApiOk<AuthPayload>>('/auth/register', { email, password }),

  me: () =>
    api.get<ApiOk<AuthUser>>('/auth/me'),
};

// ─── Endpoints candidatures ───────────────────────────────────────────────────
export const candidatureApi = {
  create: (data: FormData) =>
    api.post<ApiOk<{ id: string; numeroCandidat: string }>>('/candidatures', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  me: () =>
    api.get<ApiOk<Record<string, unknown>>>('/candidatures/me'),
};

// ─── Endpoints agent ─────────────────────────────────────────────────────────
export type StatutDossier = 'EN_ATTENTE' | 'SOUMIS' | 'DEPOSE' | 'VALIDE' | 'REJETE' | 'ADMIS';

export interface DossierDocument {
  id: string;
  type: string;
  nomFichier: string;
}

export interface Dossier {
  id: string;
  numeroCandidat: string;
  nom: string;
  prenom: string;
  filiere: string;
  statut: StatutDossier;
  montantPaye: number | null;
  numeroRecuCampost: string | null;
  dateDepot: string | null;
  documents: DossierDocument[];
}

export interface StatsCentre {
  enAttente: number;
  soumis: number;
  deposes: number;
  valides: number;
  rejetes: number;
}

export const agentApi = {
  stats: () =>
    api.get<ApiOk<StatsCentre>>('/agent/stats'),

  dossiers: (statut?: StatutDossier, page = 1) =>
    api.get<ApiOk<{ dossiers: Dossier[]; total: number; page: number; limit: number }>>(
      '/agent/dossiers',
      { params: { statut, page } }
    ),

  confirmerDepot: (id: string) =>
    api.patch<ApiOk<Dossier>>(`/agent/dossiers/${id}/confirmer-depot`),

  valider: (id: string, statut: 'VALIDE' | 'REJETE', motifRejet?: string) =>
    api.patch<ApiOk<Dossier>>(`/agent/dossiers/${id}/valider`, { statut, motifRejet }),
};

// ─── Endpoints PDF ────────────────────────────────────────────────────────────
export const pdfApi = {
  ficheCandidature: (candidatureId: string) =>
    api.get(`/pdf/fiche/${candidatureId}`, { responseType: 'blob' }),

  recepisse: (candidatureId: string) =>
    api.get(`/pdf/recepisse/${candidatureId}`, { responseType: 'blob' }),
};
