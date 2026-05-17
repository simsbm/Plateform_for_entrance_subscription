//Fichier de configuration centralisé

// ─── Types ─────────────────

export type FiliereCode =
  | 'ATT' | 'AEPT'
  | 'ITT' | 'IPT' | 'TT' | 'CPT'
  | 'ITT_ALT' | 'IPT_ALT'
  | 'IT' | 'APT';

export type NiveauConcours = 'BEPC' | 'LICENCE' | 'MASTER';

export type DiplomeOption = {
  value: string;
  labelFr: string;
  labelEn: string;
};

export type DocumentConfig = {
  /** Clé unique — utilisée aussi comme champ FormData lors de l'upload */
  id: string;
  labelFr: string;
  labelEn: string;
  obligatoire: boolean;
  /** true = zone d'upload numérique ; false = document physique uniquement */
  upload: boolean;
  formats: string[];
  maxSizeMb: number;
};

export type ScolariteFees = {
  /** Frais annuels de scolarité — Camerounais (FCFA) */
  cmr: number;
  /** Frais annuels de scolarité — Étranger (FCFA) */
  etr: number;
};

export type ConcoursConfig = {
  filiere: FiliereCode;
  nomFr: string;
  nomEn: string;
  niveau: NiveauConcours;
  dureeAns: number;
  fraisCampost: number;
  scolarite: ScolariteFees;
  /** Âge minimum au 1er janvier 2025 */
  ageMinimum: number;
  diplomesAcceptes: DiplomeOption[];
  documentsRequis: DocumentConfig[];
  /** 'ALL' = aucune restriction ; string[] = IDs de centres autorisés */
  centresAutorises: 'ALL' | string[];
  /** Date des épreuves (informatif) */
  dateEpreuve?: string;
};

// ─── Documents communs à tous les concours ────────────────────────────────────

const DOCS_COMMUNS: DocumentConfig[] = [
  {
    id: 'ACTE_NAISSANCE',
    labelFr: 'Acte de naissance certifié (moins de 3 mois)',
    labelEn: 'Certified birth certificate (less than 3 months old)',
    obligatoire: true,
    upload: true,
    formats: ['.pdf', '.jpg', '.png'],
    maxSizeMb: 5,
  },
  {
    id: 'DIPLOME',
    labelFr: 'Copie certifiée du diplôme requis',
    labelEn: 'Certified copy of required diploma',
    obligatoire: true,
    upload: true,
    formats: ['.pdf', '.jpg', '.png'],
    maxSizeMb: 5,
  },
  {
    id: 'CERTIFICAT_MEDICAL',
    labelFr: 'Certificat médical (délivré par un médecin de santé publique)',
    labelEn: 'Medical certificate (issued by a public health physician)',
    obligatoire: true,
    upload: true,
    formats: ['.pdf', '.jpg', '.png'],
    maxSizeMb: 5,
  },
  {
    id: 'PHOTO_IDENTITE',
    labelFr: '2 photos d\'identité format 4×4 cm (récentes)',
    labelEn: '2 passport-size photos 4×4 cm (recent)',
    obligatoire: true,
    upload: true,
    formats: ['.jpg', '.png'],
    maxSizeMb: 2,
  },
  {
    id: 'CNI',
    labelFr: 'Photocopie de la Carte Nationale d\'Identité',
    labelEn: 'Photocopy of National Identity Card',
    obligatoire: true,
    upload: true,
    formats: ['.pdf', '.jpg', '.png'],
    maxSizeMb: 5,
  },
  {
    id: 'ENVELOPPE',
    labelFr: 'Enveloppe format A4 timbrée à 1 000 FCFA — à fournir physiquement',
    labelEn: 'Stamped A4 envelope (1,000 FCFA) — physical document only',
    obligatoire: true,
    upload: false,
    formats: [],
    maxSizeMb: 0,
  },
  {
    id: 'ATTESTATION_SCOLARITE',
    labelFr: 'Attestation de scolarité (si diplôme en cours d\'obtention)',
    labelEn: 'Enrolment certificate (if diploma pending)',
    obligatoire: false,
    upload: true,
    formats: ['.pdf', '.jpg', '.png'],
    maxSizeMb: 5,
  },
];

// ─── Documents spécifiques par groupe ────────────────────────────────────────

const DOC_RELEVES_NOTES: DocumentConfig = {
  id: 'RELEVES_NOTES',
  labelFr: 'Relevés de notes universitaires (toutes années)',
  labelEn: 'University academic transcripts (all years)',
  obligatoire: true,
  upload: true,
  formats: ['.pdf', '.jpg', '.png'],
  maxSizeMb: 10,
};

const DOC_EQUIVALENCE: DocumentConfig = {
  id: 'EQUIVALENCE',
  labelFr: 'Attestation d\'équivalence du diplôme (si obtenu à l\'étranger)',
  labelEn: 'Diploma equivalency certificate (if obtained abroad)',
  obligatoire: false,
  upload: true,
  formats: ['.pdf', '.jpg', '.png'],
  maxSizeMb: 5,
};

const DOC_ATTESTATION_PRESENCE: DocumentConfig = {
  id: 'ATTESTATION_PRESENCE',
  labelFr: 'Attestation de présence effective en entreprise (candidats travailleurs)',
  labelEn: 'Certificate of employment / work placement (for working candidates)',
  obligatoire: true,
  upload: true,
  formats: ['.pdf', '.jpg', '.png'],
  maxSizeMb: 5,
};

// ─── Groupes de diplômes acceptés ────────────────────────────────────────────

const DIPLOMES_BEPC: DiplomeOption[] = [
  {
    value: 'BEPC',
    labelFr: 'B.E.P.C.',
    labelEn: 'B.E.P.C.',
  },
  {
    value: 'GCE_OL',
    labelFr: 'GCE O Level (4 matières scientifiques, excl. Religion)',
    labelEn: 'GCE O Level (4 science subjects, excl. Religion)',
  },
  {
    value: 'GCE_OL_TECH',
    labelFr: 'GCE O Level Technique',
    labelEn: 'GCE O Level Technical',
  },
  {
    value: 'CAP',
    labelFr: 'C.A.P.',
    labelEn: 'C.A.P.',
  },
  {
    value: 'CITY_GUILDS',
    labelFr: 'City and Guilds Part I',
    labelEn: 'City and Guilds Part I',
  },
  {
    value: 'ITC',
    labelFr: 'Intermediate Technical Certificate',
    labelEn: 'Intermediate Technical Certificate',
  },
  {
    value: 'EQUIVALENT',
    labelFr: 'Tout diplôme équivalent reconnu',
    labelEn: 'Any recognised equivalent certificate',
  },
];

const DIPLOMES_BAC_SCI: DiplomeOption[] = [
  {
    value: 'BAC_C',
    labelFr: 'Baccalauréat série C',
    labelEn: 'Baccalauréat série C',
  },
  {
    value: 'BAC_D',
    labelFr: 'Baccalauréat série D',
    labelEn: 'Baccalauréat série D',
  },
  {
    value: 'BAC_E',
    labelFr: 'Baccalauréat série E',
    labelEn: 'Baccalauréat série E',
  },
  {
    value: 'BAC_F',
    labelFr: 'Baccalauréat série F (technique)',
    labelEn: 'Baccalauréat série F (technical)',
  },
  {
    value: 'GCE_AL_SCI',
    labelFr: 'GCE Advanced Level (2 matières scientifiques minimum)',
    labelEn: 'GCE Advanced Level (minimum 2 science subjects)',
  },
  {
    value: 'EQUIVALENT',
    labelFr: 'Diplôme équivalent reconnu',
    labelEn: 'Recognised equivalent diploma',
  },
];

const DIPLOMES_BAC_LETT: DiplomeOption[] = [
  {
    value: 'BAC_A',
    labelFr: 'Baccalauréat série A',
    labelEn: 'Baccalauréat série A',
  },
  {
    value: 'BAC_B',
    labelFr: 'Baccalauréat série B',
    labelEn: 'Baccalauréat série B',
  },
  {
    value: 'BAC_G',
    labelFr: 'Baccalauréat série G',
    labelEn: 'Baccalauréat série G',
  },
  {
    value: 'BAC_H',
    labelFr: 'Baccalauréat série H',
    labelEn: 'Baccalauréat série H',
  },
  {
    value: 'GCE_AL',
    labelFr: 'GCE Advanced Level (2 matières minimum)',
    labelEn: 'GCE Advanced Level (minimum 2 subjects)',
  },
  {
    value: 'EQUIVALENT',
    labelFr: 'Diplôme équivalent reconnu',
    labelEn: 'Recognised equivalent diploma',
  },
];

const DIPLOMES_MASTER_IT: DiplomeOption[] = [
  {
    value: 'MAITRISE_MATHS',
    labelFr: 'Maîtrise en Mathématiques',
    labelEn: "Master's degree in Mathematics",
  },
  {
    value: 'MAITRISE_PHYSIQUE',
    labelFr: 'Maîtrise en Physique',
    labelEn: "Master's degree in Physics",
  },
  {
    value: 'MASTER_TELECOM',
    labelFr: 'Master I Télécommunications',
    labelEn: 'Master I Telecommunications',
  },
  {
    value: 'MASTER_ELEC',
    labelFr: 'Master I Électronique / Électrotechnique',
    labelEn: 'Master I Electronics / Electrical Engineering',
  },
  {
    value: 'MASTER_INFO',
    labelFr: 'Master I Informatique',
    labelEn: 'Master I Computer Science',
  },
  {
    value: 'DIP_ITT',
    labelFr: "Diplôme d'Ingénieur des Travaux des Télécommunications",
    labelEn: 'Diploma of Telecommunications Works Engineer',
  },
  {
    value: 'LICENCE_TELECOM',
    labelFr: 'Licence Télécommunications / Électricité',
    labelEn: 'Degree in Telecommunications / Electricity',
  },
  {
    value: 'EQUIVALENT',
    labelFr: 'Diplôme étranger équivalent reconnu',
    labelEn: 'Recognised foreign equivalent diploma',
  },
];

const DIPLOMES_MASTER_APT: DiplomeOption[] = [
  {
    value: 'MAITRISE_GESTION',
    labelFr: 'Maîtrise en Gestion',
    labelEn: "Master's degree in Management",
  },
  {
    value: 'MAITRISE_DROIT',
    labelFr: 'Maîtrise en Droit',
    labelEn: "Master's degree in Law",
  },
  {
    value: 'MASTER_LOGISTIQUE',
    labelFr: 'Master I Logistique et Transport',
    labelEn: 'Master I Logistics and Transport',
  },
  {
    value: 'MASTER_COMPTA',
    labelFr: 'Master I Comptabilité et Finance',
    labelEn: 'Master I Accounting and Finance',
  },
  {
    value: 'MASTER_MARKETING',
    labelFr: 'Master I Marketing',
    labelEn: 'Master I Marketing',
  },
  {
    value: 'MASTER_ADMIN',
    labelFr: "Master I Administration des Entreprises",
    labelEn: 'Master I Business Administration',
  },
  {
    value: 'DIP_IPT',
    labelFr: "Diplôme d'Inspecteur des Postes et Télécommunications",
    labelEn: 'Diploma of Posts & Telecommunications Inspector',
  },
  {
    value: 'EQUIVALENT',
    labelFr: 'Diplôme étranger équivalent reconnu',
    labelEn: 'Recognised foreign equivalent diploma',
  },
];

// ─── Configurations par filière ───────────────────────────────────────────────

export const CONCOURS_CONFIGS: Record<FiliereCode, ConcoursConfig> = {

  // ── Cycle Technicien BEPC — 10 centres régionaux ──────────────────────────
  // Décision N° 0000074 du 13 mai 2025

  ATT: {
    filiere: 'ATT',
    nomFr: 'Agents Techniques des Télécommunications',
    nomEn: 'Assistant Telecommunications Technicians',
    niveau: 'BEPC',
    dureeAns: 2,
    fraisCampost: 15000,
    scolarite: { cmr: 200000, etr: 400000 },
    ageMinimum: 14,
    diplomesAcceptes: DIPLOMES_BEPC,
    documentsRequis: DOCS_COMMUNS,
    centresAutorises: 'ALL',
    dateEpreuve: '13 août 2025',
  },

  AEPT: {
    filiere: 'AEPT',
    nomFr: "Agents d'Exploitation des Postes et Télécoms",
    nomEn: 'Postal Clerks',
    niveau: 'BEPC',
    dureeAns: 2,
    fraisCampost: 15000,
    scolarite: { cmr: 200000, etr: 400000 },
    ageMinimum: 14,
    diplomesAcceptes: DIPLOMES_BEPC,
    documentsRequis: DOCS_COMMUNS,
    centresAutorises: 'ALL',
    dateEpreuve: '12 août 2025',
  },

  // ── Cycle Licence — voie scientifique ─────────────────────────────────────

  ITT: {
    filiere: 'ITT',
    nomFr: 'Ingénieurs des Travaux des Télécommunications',
    nomEn: 'Telecommunications Works Engineers',
    niveau: 'LICENCE',
    dureeAns: 3,
    fraisCampost: 15000,
    scolarite: { cmr: 500000, etr: 800000 },
    ageMinimum: 15,
    diplomesAcceptes: DIPLOMES_BAC_SCI,
    documentsRequis: DOCS_COMMUNS,
    centresAutorises: 'ALL',
  },

  TT: {
    filiere: 'TT',
    nomFr: 'Techniciens des Télécommunications',
    nomEn: 'Telecommunications Technicians',
    niveau: 'LICENCE',
    dureeAns: 2,
    fraisCampost: 15000,
    scolarite: { cmr: 300000, etr: 600000 },
    ageMinimum: 15,
    diplomesAcceptes: DIPLOMES_BAC_SCI,
    documentsRequis: DOCS_COMMUNS,
    centresAutorises: 'ALL',
  },

  ITT_ALT: {
    filiere: 'ITT_ALT',
    nomFr: 'ITT — Formation par alternance',
    nomEn: 'ITT Work-Study Training',
    niveau: 'LICENCE',
    dureeAns: 3,
    fraisCampost: 20000,
    scolarite: { cmr: 500000, etr: 800000 },
    ageMinimum: 15,
    diplomesAcceptes: DIPLOMES_BAC_SCI,
    documentsRequis: [...DOCS_COMMUNS, DOC_ATTESTATION_PRESENCE],
    centresAutorises: ['centre-yaounde'],
  },

  // ── Cycle Licence — voie littéraire / gestion ─────────────────────────────

  IPT: {
    filiere: 'IPT',
    nomFr: 'Inspecteurs des Postes et Télécommunications',
    nomEn: 'Posts and Telecommunications Inspectors',
    niveau: 'LICENCE',
    dureeAns: 3,
    fraisCampost: 15000,
    scolarite: { cmr: 500000, etr: 800000 },
    ageMinimum: 15,
    diplomesAcceptes: DIPLOMES_BAC_LETT,
    documentsRequis: DOCS_COMMUNS,
    centresAutorises: 'ALL',
  },

  CPT: {
    filiere: 'CPT',
    nomFr: 'Contrôleurs des Postes et Télécommunications',
    nomEn: 'Posts and Telecommunications Controllers',
    niveau: 'LICENCE',
    dureeAns: 2,
    fraisCampost: 15000,
    scolarite: { cmr: 300000, etr: 600000 },
    ageMinimum: 15,
    diplomesAcceptes: DIPLOMES_BAC_LETT,
    documentsRequis: DOCS_COMMUNS,
    centresAutorises: 'ALL',
  },

  IPT_ALT: {
    filiere: 'IPT_ALT',
    nomFr: 'IPT — Formation par alternance',
    nomEn: 'IPT Work-Study Training',
    niveau: 'LICENCE',
    dureeAns: 3,
    fraisCampost: 20000,
    scolarite: { cmr: 500000, etr: 800000 },
    ageMinimum: 15,
    diplomesAcceptes: DIPLOMES_BAC_LETT,
    documentsRequis: [...DOCS_COMMUNS, DOC_ATTESTATION_PRESENCE],
    centresAutorises: ['centre-yaounde'],
  },

  // ── Cycle Master — Yaoundé uniquement ─────────────────────────────────────

  IT: {
    filiere: 'IT',
    nomFr: 'Ingénieurs des Télécommunications',
    nomEn: 'Telecommunications Engineers',
    niveau: 'MASTER',
    dureeAns: 2,
    fraisCampost: 25000,
    scolarite: { cmr: 600000, etr: 1000000 },
    ageMinimum: 17,
    diplomesAcceptes: DIPLOMES_MASTER_IT,
    documentsRequis: [...DOCS_COMMUNS, DOC_RELEVES_NOTES, DOC_EQUIVALENCE],
    centresAutorises: ['centre-yaounde'],
  },

  APT: {
    filiere: 'APT',
    nomFr: 'Administrateurs des Postes et Télécommunications',
    nomEn: 'Posts and Telecommunications Administrators',
    niveau: 'MASTER',
    dureeAns: 2,
    fraisCampost: 25000,
    scolarite: { cmr: 600000, etr: 1000000 },
    ageMinimum: 17,
    diplomesAcceptes: DIPLOMES_MASTER_APT,
    documentsRequis: [...DOCS_COMMUNS, DOC_RELEVES_NOTES, DOC_EQUIVALENCE],
    centresAutorises: ['centre-yaounde'],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Config pour une filière donnée, ou null si inconnue */
export function getConcoursConfig(filiere: string): ConcoursConfig | null {
  return CONCOURS_CONFIGS[filiere as FiliereCode] ?? null;
}

/** Âge minimum pour une filière */
export function getAgeMinimum(filiere: string): number {
  return getConcoursConfig(filiere)?.ageMinimum ?? 15;
}

/** Vrai si filière niveau BEPC */
export function isFiliereBepc(filiere: string): boolean {
  return getConcoursConfig(filiere)?.niveau === 'BEPC';
}

/** Vrai si filière niveau Master */
export function isFiliereMaster(filiere: string): boolean {
  return getConcoursConfig(filiere)?.niveau === 'MASTER';
}

/** Vrai si filière alternance */
export function isFiliereAlternance(filiere: string): boolean {
  return filiere === 'ITT_ALT' || filiere === 'IPT_ALT';
}

/** Liste des diplômes acceptés pour une filière */
export function getDiplomesAcceptes(filiere: string): DiplomeOption[] {
  return getConcoursConfig(filiere)?.diplomesAcceptes ?? [];
}

/** Liste des documents requis pour une filière */
export function getDocumentsRequis(filiere: string): DocumentConfig[] {
  return getConcoursConfig(filiere)?.documentsRequis ?? DOCS_COMMUNS;
}

/** Centres autorisés pour une filière */
export function getCentresAutorises(filiere: string): 'ALL' | string[] {
  return getConcoursConfig(filiere)?.centresAutorises ?? 'ALL';
}

/**
 * Calcule l'âge en années révolues au 1er janvier 2025.
 * Date de référence officielle selon les décisions ministérielles.
 */
export function getAgeAuPremierJanvier2025(dateNaissance: string): number {
  if (!dateNaissance) return 0;
  const dob = new Date(dateNaissance);
  const ref = new Date('2025-01-01');
  let age = ref.getFullYear() - dob.getFullYear();
  const mois = ref.getMonth() - dob.getMonth();
  if (mois < 0 || (mois === 0 && ref.getDate() < dob.getDate())) age--;
  return age;
}

/**
 * Valide l'éligibilité par l'âge.
 * Retourne null si valide, ou un message d'erreur bilingue sinon.
 */
export function validateAge(filiere: string, dateNaissance: string): string | null {
  if (!filiere || !dateNaissance) return null;
  const age = getAgeAuPremierJanvier2025(dateNaissance);
  const min = getAgeMinimum(filiere);
  if (age < min) {
    return `Âge minimum requis : ${min} ans au 1er janvier 2025 (vous avez ${age} an${age > 1 ? 's' : ''}). / Minimum age: ${min} years as of 1 January 2025 (you are ${age}).`;
  }
  return null;
}

/**
 * Frais CAMPOST par filière (FCFA) — pour le récapitulatif paiement.
 * Dérivé automatiquement de CONCOURS_CONFIGS pour éviter les doublons.
 */
export const MONTANTS_FILIERE: Record<FiliereCode, number> = Object.fromEntries(
  Object.entries(CONCOURS_CONFIGS).map(([k, v]) => [k, v.fraisCampost])
) as Record<FiliereCode, number>;

/**
 * Frais de scolarité annuels si admis, par filière.
 */
export const SCOLARITE_FILIERE: Record<FiliereCode, ScolariteFees> = Object.fromEntries(
  Object.entries(CONCOURS_CONFIGS).map(([k, v]) => [k, v.scolarite])
) as Record<FiliereCode, ScolariteFees>;

/** Frais fixes communs à toutes les filières (si admis) */
export const FRAIS_FIXES = {
  inscription: 10000,
  sport:       10000,
  assurance:    5000,
} as const;

/** Toutes les filières, dans l'ordre d'affichage */
export const TOUTES_FILIERES: FiliereCode[] = [
  'ATT', 'AEPT',
  'ITT', 'TT', 'ITT_ALT',
  'IPT', 'CPT', 'IPT_ALT',
  'IT', 'APT',
];
