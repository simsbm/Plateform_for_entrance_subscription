import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import {
  GraduationCap, User, BookOpen, FileUp, Receipt,
  ChevronLeft, ChevronRight, Upload, CheckCircle,
  Download, Loader2, AlertCircle, Languages,
  Wifi, Shield, Wrench, ClipboardList, Briefcase, Building2, Check, Package,
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '../components/ui/accordion';
import { toast } from 'sonner';
import { candidatureApi, centresApi, pdfApi } from '../../lib/api';
import type { CentreDepot } from '../../lib/api';
import { LangSwitcher } from '../components/LangSwitcher';
import axios from 'axios';
import {
  getConcoursConfig,
  getDiplomesAcceptes,
  getDocumentsRequis,
  getCentresAutorises,
  validateAge,
  FRAIS_FIXES,
} from '../../lib/concours-config';

// ─── Types accordéons (structure visuelle step 1) ────────────────────────────
type FiliereCard = {
  code: string;
  nomFr: string;
  nomEn: string;
  duree: string;
  Icon: React.ElementType;
};
type AccordeonSubSection = {
  titleFr: string;
  titleEn: string;
  montant: number;
  badgeClass: string;
  iconBg: string;
  iconColor: string;
  yaoundeOnly?: boolean;
  items: FiliereCard[];
};
type AccordeonSection = {
  id: string;
  titleFr: string;
  titleEn: string;
  AccIcon: React.ElementType;
  accentColor: string;
  accentBg: string;
  accentText: string;
  subSections: AccordeonSubSection[];
};

const ACCORDEON_SECTIONS: AccordeonSection[] = [
  {
    id: 'classique',
    titleFr: 'Formation classique',
    titleEn: 'Classic training',
    AccIcon: GraduationCap,
    accentColor: '#0A2A66',
    accentBg: 'bg-blue-50',
    accentText: 'text-[#0A2A66]',
    subSections: [
      {
        titleFr: 'Cycle Licence',
        titleEn: 'Licence Cycle',
        montant: 15000,
        badgeClass: 'bg-green-100 text-green-700 border border-green-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        items: [
          { code: 'ITT', nomFr: 'Ingénieurs des Travaux des Télécommunications',    nomEn: 'Telecommunications Works Engineers',          duree: '3', Icon: Wifi },
          { code: 'IPT', nomFr: 'Inspecteurs des Postes et Télécommunications',     nomEn: 'Posts and Telecommunications Inspectors',     duree: '3', Icon: Shield },
          { code: 'TT',  nomFr: 'Techniciens des Télécommunications',               nomEn: 'Telecommunications Technicians',              duree: '2', Icon: Wrench },
          { code: 'CPT', nomFr: 'Contrôleurs des Postes et Télécommunications',     nomEn: 'Posts and Telecommunications Controllers',    duree: '2', Icon: ClipboardList },
        ],
      },
      {
        titleFr: 'Cycle Master',
        titleEn: 'Master Cycle',
        montant: 25000,
        badgeClass: 'bg-purple-100 text-purple-700 border border-purple-200',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        yaoundeOnly: true,
        items: [
          { code: 'IT',  nomFr: 'Ingénieurs des Télécommunications',                nomEn: 'Telecommunications Engineers',                duree: '2', Icon: GraduationCap },
          { code: 'APT', nomFr: 'Administrateurs des Postes et Télécommunications', nomEn: 'Posts and Telecommunications Administrators', duree: '2', Icon: Building2 },
        ],
      },
    ],
  },
  {
    id: 'alternance',
    titleFr: 'Formation par alternance',
    titleEn: 'Work-Study training',
    AccIcon: Briefcase,
    accentColor: '#D97706',
    accentBg: 'bg-amber-50',
    accentText: 'text-amber-700',
    subSections: [
      {
        titleFr: 'Cycle Licence',
        titleEn: 'Licence Cycle',
        montant: 20000,
        badgeClass: 'bg-orange-100 text-orange-700 border border-orange-200',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        yaoundeOnly: true,
        items: [
          { code: 'ITT_ALT', nomFr: 'ITT — Formation par alternance', nomEn: 'ITT Work-Study Training', duree: '3', Icon: Briefcase },
          { code: 'IPT_ALT', nomFr: 'IPT — Formation par alternance', nomEn: 'IPT Work-Study Training', duree: '3', Icon: BookOpen },
        ],
      },
    ],
  },
  {
    id: 'bepc',
    titleFr: 'Formation de base — Niveau BEPC / GCE O Level',
    titleEn: 'Basic training — BEPC / GCE O Level',
    AccIcon: Wrench,
    accentColor: '#059669',
    accentBg: 'bg-green-50',
    accentText: 'text-green-700',
    subSections: [
      {
        titleFr: 'Cycle Technicien (15 000 FCFA)',
        titleEn: 'Technician Cycle (15,000 FCFA)',
        montant: 15000,
        badgeClass: 'bg-green-100 text-green-700 border border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-700',
        items: [
          { code: 'ATT',  nomFr: 'Agents Techniques des Télécommunications',      nomEn: 'Assistant Telecommunications Technicians', duree: '2', Icon: Wrench },
          { code: 'AEPT', nomFr: "Agents d'Exploitation des Postes et Télécoms",  nomEn: 'Postal Clerks',                            duree: '2', Icon: ClipboardList },
        ],
      },
    ],
  },
];

// ─── Types erreurs ────────────────────────────────────────────────────────────
type FieldKey =
  | 'filiere'
  | 'prenom' | 'nom' | 'dateNaissance' | 'lieuNaissance'
  | 'region' | 'ville' | 'nationalite' | 'sexe' | 'telephone' | 'email'
  | 'situationMatrimoniale' | 'adresseAnneeScolaire'
  | 'nomPere' | 'regionPere' | 'departementPere'
  | 'nomMere' | 'regionMere' | 'departementMere'
  | 'langueComposition' | 'activitesExtraScolaires'
  | 'typeDiplome' | 'anneeObtention' | 'etablissement' | 'mention'
  | 'centreDepotId' | 'numeroRecuCampost';

type FieldErrors = Partial<Record<FieldKey, string[]>>;

const STEP_FIELDS: Record<number, FieldKey[]> = {
  1: ['filiere'],
  2: ['prenom', 'nom', 'dateNaissance', 'lieuNaissance', 'region', 'ville',
      'nationalite', 'telephone', 'email', 'situationMatrimoniale',
      'adresseAnneeScolaire', 'nomPere', 'regionPere', 'departementPere',
      'nomMere', 'regionMere', 'departementMere', 'langueComposition'],
  3: ['typeDiplome', 'anneeObtention', 'etablissement'],
  4: [],
  5: ['centreDepotId', 'numeroRecuCampost'],
};

type Step = 1 | 2 | 3 | 4 | 5;

// ─── Helper téléchargement PDF ────────────────────────────────────────────────
async function downloadBlob(
  promise: Promise<{ data: Blob }>,
  filename: string,
  onError: () => void,
) {
  try {
    const { data } = await promise;
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    onError();
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function ApplicationFormPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [fieldErrors, setFieldErrors]   = useState<FieldErrors>({});

  const [submittedId,     setSubmittedId]     = useState<string | null>(null);
  const [submittedNumero, setSubmittedNumero] = useState('');

  const [centres, setCentres]               = useState<CentreDepot[]>([]);
  const [centresLoading, setCentresLoading] = useState(false);

  const [formData, setFormData] = useState({
    // ── Étape 1 — Concours ──────────────────────────────
    filiere: '',
    // ── Étape 2 — Identité ──────────────────────────────
    prenom: '', nom: '',
    dateNaissance: '', lieuNaissance: '',
    region: '', ville: '',
    nationalite: 'Camerounaise',
    sexe: '' as '' | 'M' | 'F',
    telephone: '', email: '',
    situationMatrimoniale: '' as '' | 'CELIBATAIRE' | 'MARIE',
    adresseAnneeScolaire: '',
    nomPere: '', regionPere: '', departementPere: '',
    nomMere: '', regionMere: '', departementMere: '',
    langueComposition: '' as '' | 'FRANCAIS' | 'ANGLAIS',
    activitesExtraScolaires: '',
    // ── Étape 3 — Académique ────────────────────────────
    typeDiplome: '',
    anneeObtention: '',
    etablissement: '',
    mention: '',
    // ── Étape 4 — Documents (clé = doc.id) ─────────────
    documents: {} as Record<string, File | null>,
    // ── Étape 5 — Paiement + Centre ─────────────────────
    centreDepotId: '',
    numeroRecuCampost: '',
  });

  // ── Dérivés depuis la filière choisie ──────────────────────────────────────
  const config          = getConcoursConfig(formData.filiere);
  const diplomes        = getDiplomesAcceptes(formData.filiere);
  const docsRequis      = getDocumentsRequis(formData.filiere);
  const centresAutorises = getCentresAutorises(formData.filiere);
  const montant         = config?.fraisCampost ?? 0;
  const scolarite       = config?.scolarite;

  const centresVisibles = centresAutorises === 'ALL'
    ? centres
    : centres.filter((c) => (centresAutorises as string[]).includes(c.id));

  useEffect(() => {
    setCentresLoading(true);
    centresApi.list()
      .then(({ data }) => setCentres(data.data))
      .catch(() => toast.error(t('apply.documents.centerLoadError')))
      .finally(() => setCentresLoading(false));
  }, [t]);

  const [openAccordion, setOpenAccordion] = useState<string>('classique');
  const selectedCardRef = useRef<HTMLButtonElement>(null);

  const [subStep2, setSubStep2] = useState<'A' | 'B' | 'C' | 'D' | 'summary'>('A');
  useEffect(() => { if (currentStep === 2) setSubStep2('A'); }, [currentStep]);

  useEffect(() => {
    if (formData.filiere && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [formData.filiere]);

  const steps = [
    { number: 1, title: t('apply.steps.program'),   icon: GraduationCap },
    { number: 2, title: t('apply.steps.identity'),  icon: User },
    { number: 3, title: t('apply.steps.academic'),  icon: BookOpen },
    { number: 4, title: t('apply.steps.documents'), icon: FileUp },
    { number: 5, title: t('apply.steps.payment'),   icon: Receipt },
  ];

  const progress = (currentStep / 5) * 100;

  const fe = (field: FieldKey) => fieldErrors[field]?.[0];
  const clearFe = (field: FieldKey) =>
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  const errClass = (field: FieldKey) =>
    fe(field) ? 'border-destructive focus-visible:ring-destructive' : '';

  const handleNext = () => {
    if (currentStep === 1 && !formData.filiere) return;
    if (currentStep < 5) setCurrentStep((s) => (s + 1) as Step);
  };
  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep((s) => (s - 1) as Step);
  };

  const handleFileUpload = (docId: string, file: File | null) => {
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, [docId]: file },
    }));
  };

  const handleSubmit = async () => {
    if (!formData.numeroRecuCampost.trim()) {
      setFieldErrors({ numeroRecuCampost: [t('apply.payment.receiptRequired')] });
      return;
    }
    setSubmitError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        nom:               formData.nom,
        prenom:            formData.prenom,
        dateNaissance:     formData.dateNaissance,
        lieuNaissance:     formData.lieuNaissance,
        region:            formData.region,
        ville:             formData.ville,
        nationalite:       formData.nationalite,
        telephone:         formData.telephone,
        email:             formData.email,
        typeDiplome:       formData.typeDiplome,
        anneeObtention:    Number(formData.anneeObtention),
        etablissement:     formData.etablissement,
        filiere:           formData.filiere,
        numeroRecuCampost: formData.numeroRecuCampost.trim(),
        centreDepotId:     formData.centreDepotId,
      };
      if (formData.situationMatrimoniale)    payload.situationMatrimoniale    = formData.situationMatrimoniale;
      if (formData.adresseAnneeScolaire)     payload.adresseAnneeScolaire     = formData.adresseAnneeScolaire;
      if (formData.nomPere)                  payload.nomPere                  = formData.nomPere;
      if (formData.regionPere)               payload.regionPere               = formData.regionPere;
      if (formData.departementPere)          payload.departementPere          = formData.departementPere;
      if (formData.nomMere)                  payload.nomMere                  = formData.nomMere;
      if (formData.regionMere)               payload.regionMere               = formData.regionMere;
      if (formData.departementMere)          payload.departementMere          = formData.departementMere;
      if (formData.activitesExtraScolaires)  payload.activitesExtraScolaires  = formData.activitesExtraScolaires;
      if (formData.langueComposition)        payload.langueComposition        = formData.langueComposition;
      if (formData.mention)                  payload.mention                  = formData.mention;

      const { data: resp } = await candidatureApi.create(payload);
      const { id, numeroCandidat } = resp.data.candidature;

      const fd = new FormData();
      Object.entries(formData.documents).forEach(([key, file]) => {
        if (file) fd.append(key, file);
      });
      if ([...fd.keys()].length > 0) {
        await candidatureApi.uploadDocuments(id, fd);
      }

      setSubmittedId(id);
      setSubmittedNumero(numeroCandidat);
      toast.success(t('apply.successToast'));

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const body = err.response?.data;
        if (body?.errors) {
          const errors = body.errors as FieldErrors;
          setFieldErrors(errors);
          const errorKeys = Object.keys(errors) as FieldKey[];
          let targetStep: Step = 5;
          for (let s = 1; s <= 5; s++) {
            if (errorKeys.some((k) => STEP_FIELDS[s]?.includes(k))) {
              targetStep = s as Step;
              break;
            }
          }
          setCurrentStep(targetStep);
          toast.error(t('apply.errorToast'));
        } else {
          const msg = body?.message ?? t('common.error');
          setSubmitError(msg);
          toast.error(msg);
        }
      } else {
        setSubmitError(t('common.unexpectedError'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const regions = [
    'Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral',
    'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest',
  ];

  // ─── Confirmation ─────────────────────────────────────────────────────────
  if (submittedId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-primary/5 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full shadow-2xl">
          <CardContent className="pt-10 pb-8 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-700">{t('apply.confirmation.title')}</h2>
              <p className="text-muted-foreground mt-2">{t('apply.confirmation.subtitle')}</p>
            </div>
            <div className="bg-muted rounded-lg px-6 py-4 text-left space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {t('apply.confirmation.numberLabel')}
              </p>
              <p className="text-2xl font-mono font-bold text-primary">{submittedNumero}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('apply.confirmation.numberHint')}</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">{t('apply.confirmation.downloadTitle')}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex-1 gap-2" onClick={() => downloadBlob(
                  pdfApi.ficheCandidature(submittedId),
                  `fiche-${submittedNumero}.pdf`,
                  () => toast.error(t('dashboard.downloadError'))
                )}>
                  <Download className="w-4 h-4" /> {t('apply.confirmation.downloadFiche')}
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={() => downloadBlob(
                  pdfApi.recepisse(submittedId),
                  `recepisse-${submittedNumero}.pdf`,
                  () => toast.error(t('dashboard.downloadError'))
                )}>
                  <Download className="w-4 h-4" /> {t('apply.confirmation.downloadRecepisse')}
                </Button>
              </div>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
              {t('apply.confirmation.dashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Formulaire ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-18 h-18 rounded-lg flex items-center justify-center">
              <img src="src\img\cropped-logo-supptic.png" alt="logo of supptic" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">{t('apply.header')}</h1>
              <p className="text-xs text-muted-foreground">{t('apply.headerSub')}</p>
            </div>
          </div>
          <LangSwitcher />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {t('apply.stepOf', { current: currentStep, total: 5 })}
            </h2>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}{t('apply.completed')}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Indicateurs d'étapes */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex flex-col items-center gap-2 ${
                currentStep >= step.number ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                currentStep >= step.number ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {currentStep > step.number
                  ? <CheckCircle className="w-6 h-6" />
                  : <step.icon className="w-6 h-6" />
                }
              </div>
              <span className="text-xs text-center font-medium hidden md:block">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Carte principale */}
        <Card className="shadow-xl">
          <CardContent className="pt-8">

            {/* ── Badge concours sélectionné (étapes 2-5) ── */}
            {currentStep > 1 && config && (
              <div className="flex items-center gap-3 mb-6 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">
                    Concours sélectionné / Selected programme
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {config.nomFr}
                    <span className="font-normal text-muted-foreground"> / {config.nomEn}</span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="shrink-0 text-xs h-8 px-3"
                >
                  Modifier
                </Button>
              </div>
            )}

            {/* ═══════════════════════════════════════
                ÉTAPE 1 — Choix du concours
            ═══════════════════════════════════════ */}
            {currentStep === 1 && (
              <div className="space-y-5 pb-24">
                <div>
                  <h3 className="text-2xl font-bold">{t('apply.programs.title')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choisissez la filière à laquelle vous souhaitez postuler.
                    <span className="italic"> / Select the programme you wish to apply for.</span>
                  </p>
                </div>

                {fe('filiere') && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fe('filiere')}</span>
                  </div>
                )}

                <Accordion
                  type="single"
                  value={openAccordion}
                  onValueChange={(v) => setOpenAccordion(v || openAccordion)}
                  className="space-y-3"
                >
                  {ACCORDEON_SECTIONS.map((acc) => (
                    <AccordionItem
                      key={acc.id}
                      value={acc.id}
                      className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm"
                    >
                      {/* ── Header accordéon : fond blanc + bordure gauche colorée ── */}
                      <AccordionTrigger
                        className="px-5 py-4 hover:no-underline hover:bg-gray-50/60 [&>svg]:text-gray-400 [&>svg]:transition-transform [&>svg]:duration-300"
                        style={{ borderLeft: `4px solid ${acc.accentColor}` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${acc.accentBg}`}>
                            <acc.AccIcon className={`w-5 h-5 ${acc.accentText}`} />
                          </div>
                          <div className="text-left">
                            <p className={`font-bold text-sm md:text-base leading-tight ${acc.accentText}`}>{acc.titleFr}</p>
                            <p className="text-xs text-gray-400 italic mt-0.5">{acc.titleEn}</p>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-4 md:px-5 pb-6 pt-5 bg-gray-50/30 border-t border-gray-100">
                        <div className="space-y-7">
                          {acc.subSections.map((sub) => (
                            <div key={sub.titleFr} className="space-y-3">

                              {/* Titre sous-section avec séparateur */}
                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                  {sub.titleFr}
                                </span>
                                <div className="flex-1 h-px bg-gray-200" />
                                {sub.yaoundeOnly && (
                                  <span className="text-[11px] text-gray-400 whitespace-nowrap"> Yaoundé only</span>
                                )}
                              </div>

                              {/* Grille de cartes */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {sub.items.map(({ code, nomFr, nomEn, duree, Icon }) => {
                                  const isSelected = formData.filiere === code;
                                  return (
                                    <button
                                      key={code}
                                      ref={isSelected ? selectedCardRef : undefined}
                                      type="button"
                                      onClick={() => {
                                        setFormData((prev) => ({
                                          ...prev,
                                          filiere: code,
                                          ...(prev.filiere !== code && {
                                            typeDiplome: '',
                                            documents: {},
                                            centreDepotId: '',
                                          }),
                                        }));
                                        clearFe('filiere');
                                      }}
                                      className={[
                                        'relative rounded-xl text-left cursor-pointer select-none w-full p-4',
                                        'transition-all duration-200',
                                        isSelected
                                          ? 'border-2 border-[#0A2A66] bg-[#EFF6FF] shadow-[0_0_0_4px_rgba(10,42,102,0.07)]'
                                          : 'border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300',
                                      ].join(' ')}
                                    >
                                      {/* Coche verte quand sélectionné */}
                                      {isSelected && (
                                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                        </div>
                                      )}

                                      {/* Icône + Code + Durée + Noms */}
                                      <div className="flex items-start gap-3 pr-8 mb-3">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${sub.iconBg}`}>
                                          <Icon className={`w-5 h-5 ${sub.iconColor}`} />
                                        </div>
                                        <div className="flex-1 min-w-0 pt-0.5">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#0A2A66] text-white' : 'bg-primary/10 text-primary'}`}>
                                              {code}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              {duree} {t('apply.programs.years')}
                                            </span>
                                          </div>
                                          <p className="text-[15px] font-bold leading-snug text-gray-900">{nomFr}</p>
                                          <p className="text-[13px] text-gray-400 italic mt-0.5 leading-snug">{nomEn}</p>
                                        </div>
                                      </div>

                                      {/* Bas de carte : prix + badge Yaoundé */}
                                      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100/80">
                                        <span className={`text-sm font-bold ${isSelected ? 'text-[#0A2A66]' : 'text-green-600'}`}>
                                          {sub.montant.toLocaleString('fr-FR')} FCFA
                                        </span>
                                        {sub.yaoundeOnly && (
                                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                             <span className="hidden sm:inline">Yaoundé only</span>
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>

                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {/* ═══════════════════════════════════════
                ÉTAPE 2 — Informations personnelles (sous-étapes A→D→Récap)
            ═══════════════════════════════════════ */}
            {currentStep === 2 && (() => {
              const count2A = [formData.prenom, formData.nom, formData.dateNaissance, formData.lieuNaissance, formData.nationalite, formData.sexe].filter(Boolean).length;
              const count2B = [formData.telephone, formData.email, formData.adresseAnneeScolaire, formData.region, formData.ville].filter(Boolean).length;
              const count2C = [formData.nomPere, formData.regionPere, formData.nomMere, formData.regionMere].filter(Boolean).length;
              const count2D = [formData.situationMatrimoniale, formData.langueComposition, formData.activitesExtraScolaires].filter(Boolean).length;

              const subStepOrder = { A: 0, B: 1, C: 2, D: 3, summary: 4 } as const;
              const currentIdx = subStepOrder[subStep2];

              const SUB_META = [
                { id: 'A' as const, label: 'Identité',    total: 6, count: count2A },
                { id: 'B' as const, label: 'Coordonnées', total: 5, count: count2B },
                { id: 'C' as const, label: 'Famille',     total: 4, count: count2C },
                { id: 'D' as const, label: 'Autres',      total: 3, count: count2D },
              ];

              const goSubNext = () => {
                if (subStep2 === 'A') setSubStep2('B');
                else if (subStep2 === 'B') setSubStep2('C');
                else if (subStep2 === 'C') setSubStep2('D');
                else if (subStep2 === 'D') setSubStep2('summary');
              };
              const goSubPrev = () => {
                if (subStep2 === 'A') setCurrentStep(1);
                else if (subStep2 === 'B') setSubStep2('A');
                else if (subStep2 === 'C') setSubStep2('B');
                else if (subStep2 === 'D') setSubStep2('C');
                else if (subStep2 === 'summary') setSubStep2('D');
              };

              return (
                <div className="space-y-6">

                  {/* ── Barre de progression sous-étapes ── */}
                  {subStep2 !== 'summary' && (
                    <div className="flex items-center bg-gray-50 rounded-xl p-2 gap-1">
                      {SUB_META.map((s, i) => {
                        const idx = subStepOrder[s.id];
                        const isDone = idx < currentIdx;
                        const isCurrent = idx === currentIdx;
                        return (
                          <div key={s.id} className="flex items-center flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => isDone && setSubStep2(s.id)}
                              disabled={!isDone && !isCurrent}
                              className={[
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full justify-center',
                                isCurrent ? 'bg-white shadow-sm text-[#0A2A66] border border-[#0A2A66]/20' :
                                isDone    ? 'text-green-700 hover:bg-white cursor-pointer' :
                                            'text-gray-400 cursor-default',
                              ].join(' ')}
                            >
                              <span className={[
                                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                                isCurrent ? 'bg-[#0A2A66] text-white' :
                                isDone    ? 'bg-green-500 text-white' :
                                            'bg-gray-200 text-gray-400',
                              ].join(' ')}>
                                {isDone ? '✓' : `${i + 1}`}
                              </span>
                              <span className="hidden sm:inline truncate">{s.label}</span>
                            </button>
                            {i < SUB_META.length - 1 && (
                              <div className={`h-px w-3 shrink-0 mx-0.5 ${idx < currentIdx ? 'bg-green-300' : 'bg-gray-200'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ══ 2A — IDENTITÉ ══════════════════════════════════════ */}
                  {subStep2 === 'A' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Identité</h3>
                          <p className="text-sm text-gray-500 mt-0.5">Informations d'état civil</p>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                          {count2A} / 6 complétés
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="nom">{t('apply.identity.lastName')} <span className="text-destructive">*</span></Label>
                          <Input id="nom" value={formData.nom} className={errClass('nom')}
                            onChange={(e) => { setFormData({ ...formData, nom: e.target.value }); clearFe('nom'); }} />
                          {fe('nom') && <p className="text-sm text-destructive">{fe('nom')}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="prenom">{t('apply.identity.firstName')} <span className="text-destructive">*</span></Label>
                          <Input id="prenom" value={formData.prenom} className={errClass('prenom')}
                            onChange={(e) => { setFormData({ ...formData, prenom: e.target.value }); clearFe('prenom'); }} />
                          {fe('prenom') && <p className="text-sm text-destructive">{fe('prenom')}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dateNaissance">{t('apply.identity.birthDate')} <span className="text-destructive">*</span></Label>
                          {config && (
                            <p className="text-xs text-gray-400">Âge min. : <strong>{config.ageMinimum} ans</strong> au 1er jan. 2025</p>
                          )}
                          <Input id="dateNaissance" type="date" value={formData.dateNaissance} className={errClass('dateNaissance')}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({ ...formData, dateNaissance: val });
                              clearFe('dateNaissance');
                              if (formData.filiere && val) {
                                const ageErr = validateAge(formData.filiere, val);
                                if (ageErr) setFieldErrors((prev) => ({ ...prev, dateNaissance: [ageErr] }));
                              }
                            }}
                          />
                          {fe('dateNaissance') && <p className="text-sm text-destructive">{fe('dateNaissance')}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lieuNaissance">{t('apply.identity.birthPlace')} <span className="text-destructive">*</span></Label>
                          <Input id="lieuNaissance" value={formData.lieuNaissance} className={errClass('lieuNaissance')}
                            onChange={(e) => { setFormData({ ...formData, lieuNaissance: e.target.value }); clearFe('lieuNaissance'); }} />
                          {fe('lieuNaissance') && <p className="text-sm text-destructive">{fe('lieuNaissance')}</p>}
                        </div>

                        {/* Nationalité — toggle */}
                        <div className="space-y-2">
                          <Label>{t('apply.identity.nationality')} <span className="text-destructive">*</span></Label>
                          <div className="flex gap-3">
                            {(['Camerounaise', 'Étrangère'] as const).map((val) => (
                              <button key={val} type="button"
                                onClick={() => setFormData({ ...formData, nationalite: val })}
                                className={[
                                  'flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors',
                                  formData.nationalite === val
                                    ? 'border-[#0A2A66] bg-[#EFF6FF] text-[#0A2A66]'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300',
                                ].join(' ')}
                              >
                                {val === 'Camerounaise' ? ' Camerounais(e)' : ' Étranger(e)'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sexe — toggle */}
                        <div className="space-y-2">
                          <Label>Sexe <span className="text-destructive">*</span></Label>
                          <div className="flex gap-3">
                            {([['M', 'Masculin'], ['F', ' Féminin']] as const).map(([val, label]) => (
                              <button key={val} type="button"
                                onClick={() => setFormData({ ...formData, sexe: val })}
                                className={[
                                  'flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors',
                                  formData.sexe === val
                                    ? 'border-[#0A2A66] bg-[#EFF6FF] text-[#0A2A66]'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300',
                                ].join(' ')}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ 2B — COORDONNÉES ═══════════════════════════════════ */}
                  {subStep2 === 'B' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Coordonnées</h3>
                          <p className="text-sm text-gray-500 mt-0.5">Contact et localisation</p>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                          {count2B} / 5 complétés
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="telephone">{t('apply.identity.phone')} <span className="text-destructive">*</span></Label>
                          <Input id="telephone" type="tel" placeholder={t('apply.identity.phonePlaceholder')}
                            value={formData.telephone} className={errClass('telephone')}
                            onChange={(e) => { setFormData({ ...formData, telephone: e.target.value }); clearFe('telephone'); }} />
                          {fe('telephone') && <p className="text-sm text-destructive">{fe('telephone')}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">{t('apply.identity.email')} <span className="text-destructive">*</span></Label>
                          <Input id="email" type="email" value={formData.email} className={errClass('email')}
                            onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearFe('email'); }} />
                          {fe('email') && <p className="text-sm text-destructive">{fe('email')}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label>{t('apply.identity.region')}</Label>
                          <Select value={formData.region} onValueChange={(v) => { setFormData({ ...formData, region: v }); clearFe('region'); }}>
                            <SelectTrigger className={errClass('region')}>
                              <SelectValue placeholder={t('apply.identity.regionPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                              {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ville">{t('apply.identity.city')}</Label>
                          <Input id="ville" value={formData.ville}
                            onChange={(e) => setFormData({ ...formData, ville: e.target.value })} />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="adresseAnneeScolaire">{t('apply.identity.academicAddress')}</Label>
                          <Input id="adresseAnneeScolaire" value={formData.adresseAnneeScolaire}
                            onChange={(e) => setFormData({ ...formData, adresseAnneeScolaire: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ 2C — FAMILLE ═══════════════════════════════════════ */}
                  {subStep2 === 'C' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Famille</h3>
                          <p className="text-sm text-gray-500 mt-0.5">Informations parentales</p>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                          {count2C} / 4 complétés
                        </span>
                      </div>

                      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
                        <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">Ces informations figurent sur la fiche officielle — leur saisie est recommandée mais optionnelle.</p>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('apply.identity.fatherSection')}</p>
                          <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="nomPere">{t('apply.identity.fatherName')}</Label>
                              <Input id="nomPere" value={formData.nomPere}
                                onChange={(e) => setFormData({ ...formData, nomPere: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="regionPere">{t('apply.identity.fatherRegion')}</Label>
                              <Input id="regionPere" value={formData.regionPere}
                                onChange={(e) => setFormData({ ...formData, regionPere: e.target.value })} />
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('apply.identity.motherSection')}</p>
                          <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                              <Label htmlFor="nomMere">{t('apply.identity.motherName')}</Label>
                              <Input id="nomMere" value={formData.nomMere}
                                onChange={(e) => setFormData({ ...formData, nomMere: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="regionMere">{t('apply.identity.motherRegion')}</Label>
                              <Input id="regionMere" value={formData.regionMere}
                                onChange={(e) => setFormData({ ...formData, regionMere: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ 2D — AUTRES ════════════════════════════════════════ */}
                  {subStep2 === 'D' && (
                    <div className="space-y-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Autres informations</h3>
                          <p className="text-sm text-gray-500 mt-0.5">Situation et langue d'examen</p>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                          {count2D} / 3 complétés
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Label>{t('apply.identity.maritalStatus')}</Label>
                        <div className="flex gap-3">
                          {(['CELIBATAIRE', 'MARIE'] as const).map((val) => (
                            <button key={val} type="button"
                              onClick={() => { setFormData({ ...formData, situationMatrimoniale: val }); clearFe('situationMatrimoniale'); }}
                              className={[
                                'flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors',
                                formData.situationMatrimoniale === val
                                  ? 'border-[#0A2A66] bg-[#EFF6FF] text-[#0A2A66]'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300',
                              ].join(' ')}
                            >
                              {val === 'CELIBATAIRE' ? t('apply.identity.single') : t('apply.identity.married')}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Languages className="w-4 h-4 text-primary" />
                          <Label className="font-semibold">{t('apply.programs.langueComposition')}</Label>
                        </div>
                        <p className="text-xs text-gray-400">{t('apply.programs.langueCompositionHint')}</p>
                        <div className="flex gap-3">
                          {(['FRANCAIS', 'ANGLAIS'] as const).map((l) => (
                            <button key={l} type="button"
                              onClick={() => { setFormData({ ...formData, langueComposition: l }); clearFe('langueComposition'); }}
                              className={[
                                'flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200',
                                formData.langueComposition === l
                                  ? 'border-[#0A2A66] bg-[#0A2A66] text-white shadow-md'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white',
                              ].join(' ')}
                            >
                              {l === 'FRANCAIS' ? '🇫 Français' : '🇬English'}
                            </button>
                          ))}
                        </div>
                        {fe('langueComposition') && <p className="text-sm text-destructive">{fe('langueComposition')}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="activitesExtraScolaires">{t('apply.academic.extraActivities')}</Label>
                        <Textarea id="activitesExtraScolaires"
                          placeholder={t('apply.academic.extraActivitiesPlaceholder')}
                          value={formData.activitesExtraScolaires}
                          onChange={(e) => setFormData({ ...formData, activitesExtraScolaires: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* ══ RÉCAPITULATIF ══════════════════════════════════════ */}
                  {subStep2 === 'summary' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Récapitulatif</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Vérifiez vos informations avant de continuer vers l'étape 3</p>
                      </div>

                      {/* Bloc 2A */}
                      {[
                        {
                          id: 'A', label: '2A — Identité', count: count2A, optional: false,
                          onEdit: () => setSubStep2('A'),
                          rows: [
                            ['Nom', formData.nom], ['Prénom', formData.prenom],
                            ['Date de naissance', formData.dateNaissance], ['Lieu de naissance', formData.lieuNaissance],
                            ['Nationalité', formData.nationalite], ['Sexe', formData.sexe === 'M' ? 'Masculin' : formData.sexe === 'F' ? 'Féminin' : ''],
                          ],
                        },
                        {
                          id: 'B', label: '2B — Coordonnées', count: count2B, optional: false,
                          onEdit: () => setSubStep2('B'),
                          rows: [
                            ['Téléphone', formData.telephone], ['Email', formData.email],
                            ['Région', formData.region], ['Ville', formData.ville],
                            ['Adresse académique', formData.adresseAnneeScolaire],
                          ],
                        },
                        {
                          id: 'C', label: '2C — Famille', count: count2C, optional: true,
                          onEdit: () => setSubStep2('C'),
                          rows: [
                            ['Père', formData.nomPere], ['Région père', formData.regionPere],
                            ['Mère', formData.nomMere], ['Région mère', formData.regionMere],
                          ],
                        },
                        {
                          id: 'D', label: '2D — Autres', count: count2D, optional: true,
                          onEdit: () => setSubStep2('D'),
                          rows: [
                            ['Situation', formData.situationMatrimoniale === 'CELIBATAIRE' ? 'Célibataire' : formData.situationMatrimoniale === 'MARIE' ? 'Marié(e)' : ''],
                            ["Langue d'examen", formData.langueComposition === 'FRANCAIS' ? '🇫🇷 Français' : formData.langueComposition === 'ANGLAIS' ? '🇬🇧 English' : ''],
                            ['Activités', formData.activitesExtraScolaires],
                          ],
                        },
                      ].map((bloc) => (
                        <div key={bloc.id} className="rounded-xl border border-gray-200 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${bloc.count > 0 || !bloc.optional ? 'bg-green-500' : 'bg-gray-300'}`}>
                                {bloc.count > 0 ? '✓' : bloc.optional ? '○' : '!'}
                              </span>
                              <span className="text-sm font-semibold text-gray-700">{bloc.label}</span>
                              {bloc.optional && bloc.count === 0 && (
                                <span className="text-[11px] text-gray-400">(optionnel)</span>
                              )}
                            </div>
                            <button type="button" onClick={bloc.onEdit}
                              className="text-xs text-[#0A2A66] font-semibold hover:underline">
                              Modifier
                            </button>
                          </div>
                          <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2">
                            {bloc.rows.filter(([, v]) => v).map(([label, value]) => (
                              <div key={label} className={value && value.length > 30 ? 'col-span-2' : ''}>
                                <p className="text-[11px] text-gray-400 leading-none mb-0.5">{label}</p>
                                <p className="text-sm font-medium text-gray-800">{value || '—'}</p>
                              </div>
                            ))}
                            {bloc.rows.every(([, v]) => !v) && (
                              <p className="col-span-2 text-sm text-gray-400 italic">Aucune information saisie</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Navigation interne ── */}
                  <div className="flex items-center justify-between pt-5 border-t border-gray-100 mt-2">
                    <Button variant="outline" type="button" onClick={goSubPrev}>
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      {subStep2 === 'A' ? t('common.previous') : 'Précédent'}
                    </Button>

                    {subStep2 === 'summary' ? (
                      <Button type="button" onClick={() => setCurrentStep(3)}
                        className="gap-2 bg-[#0A2A66] hover:bg-[#0A2A66]/90 text-white">
                        Confirmer et continuer
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button type="button" onClick={goSubNext} className="gap-2">
                        {subStep2 === 'D' ? 'Voir le récapitulatif' : 'Suivant'}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                </div>
              );
            })()}

            {/* ═══════════════════════════════════════
                ÉTAPE 3 — Informations académiques
            ═══════════════════════════════════════ */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">{t('apply.academic.title')}</h3>
                <div className="space-y-6">

                  {/* Diplôme dynamique selon filière */}
                  <div className="space-y-2">
                    <Label>{t('apply.academic.diplomaType')}</Label>
                    <Select
                      value={formData.typeDiplome}
                      onValueChange={(v) => { setFormData({ ...formData, typeDiplome: v }); clearFe('typeDiplome'); }}
                    >
                      <SelectTrigger className={errClass('typeDiplome')}>
                        <SelectValue placeholder={t('apply.academic.diplomaPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {diplomes.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {lang === 'fr' ? d.labelFr : d.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fe('typeDiplome') && <p className="text-sm text-destructive">{fe('typeDiplome')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anneeObtention">{t('apply.academic.year')}</Label>
                    <Input
                      id="anneeObtention"
                      type="number"
                      min="1990"
                      max="2026"
                      value={formData.anneeObtention}
                      className={errClass('anneeObtention')}
                      onChange={(e) => { setFormData({ ...formData, anneeObtention: e.target.value }); clearFe('anneeObtention'); }}
                    />
                    {fe('anneeObtention') && <p className="text-sm text-destructive">{fe('anneeObtention')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="etablissement">{t('apply.academic.institution')}</Label>
                    <Input
                      id="etablissement"
                      placeholder={t('apply.academic.institutionPlaceholder')}
                      value={formData.etablissement}
                      className={errClass('etablissement')}
                      onChange={(e) => { setFormData({ ...formData, etablissement: e.target.value }); clearFe('etablissement'); }}
                    />
                    {fe('etablissement') && <p className="text-sm text-destructive">{fe('etablissement')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mention">
                      Mention  {' '}
                      <span className="text-muted-foreground text-xs font-normal">(optionnel / optional)</span>
                    </Label>
                    <Input
                      id="mention"
                      placeholder="Ex : Bien, Assez Bien, Mention Spéciale…"
                      value={formData.mention}
                      onChange={(e) => setFormData({ ...formData, mention: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════
                ÉTAPE 4 — Documents requis
            ═══════════════════════════════════════ */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{t('apply.documents.title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {docsRequis.filter((d) => d.obligatoire && d.upload).length}{' '}
                    document(s) à téléverser /{' '}
                    {docsRequis.filter((d) => d.obligatoire && d.upload).length}{' '}
                    document(s) to upload
                  </p>
                </div>

                <div className="space-y-3">
                  {docsRequis.map((doc) => {
                    const file = formData.documents[doc.id] ?? null;
                    const hasFile = file !== null;

                    // Document physique — pas d'upload
                    if (!doc.upload) {
                      return (
                        <div key={doc.id} className="border rounded-lg p-4 bg-amber-50 border-amber-200 flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Package className="w-5 h-5 text-amber-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                                OBLIGATOIRE / REQUIRED
                              </span>
                              <span className="text-xs bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5 font-medium">
                                Document physique / Physical only
                              </span>
                            </div>
                            <p className="text-sm font-medium text-amber-900">
                              {lang === 'fr' ? doc.labelFr : doc.labelEn}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    // Document numérique — zone d'upload
                    return (
                      <div
                        key={doc.id}
                        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                          hasFile ? 'border-green-300 bg-green-50/30' : 'hover:border-primary'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${hasFile ? 'bg-green-100' : 'bg-primary/10'}`}>
                              {hasFile
                                ? <CheckCircle className="w-5 h-5 text-green-600" />
                                : <Upload className="w-5 h-5 text-primary" />
                              }
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                  doc.obligatoire
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}>
                                  {doc.obligatoire ? 'OBLIGATOIRE / REQUIRED' : 'OPTIONNEL / OPTIONAL'}
                                </span>
                              </div>
                              <p className="text-sm font-medium">{lang === 'fr' ? doc.labelFr : doc.labelEn}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {hasFile
                                  ? file!.name
                                  : `${doc.formats.join(', ')} — max ${doc.maxSizeMb} Mo`}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                          >
                            {hasFile ? t('apply.documents.change') : t('apply.documents.choose')}
                          </Button>
                        </div>
                        <input
                          id={`file-${doc.id}`}
                          type="file"
                          accept={doc.formats.join(',')}
                          className="hidden"
                          onChange={(e) => handleFileUpload(doc.id, e.target.files?.[0] ?? null)}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">{t('apply.documents.sizeWarning')}</p>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════
                ÉTAPE 5 — Paiement et confirmation
            ═══════════════════════════════════════ */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">{t('apply.payment.title')}</h3>

                {/* Récapitulatif concours + frais CAMPOST */}
                <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">{t('apply.payment.selectedProgram')}</p>
                      {config && (
                        <p className="text-base font-semibold opacity-95 mt-0.5">
                          {config.nomFr}
                          <span className="text-sm opacity-70 font-normal"> / {config.nomEn}</span>
                        </p>
                      )}
                      <p className="text-xs opacity-75 mt-2">{t('apply.payment.fees')}</p>
                      <p className="text-4xl font-bold mt-1">
                        {montant.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                    <Receipt className="w-16 h-16 opacity-40" />
                  </div>
                </div>

                

                {/* Instructions paiement CAMPOST */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-2">
                  <p className="text-sm font-semibold text-blue-900">{t('apply.payment.howTitle')}</p>
                  <p className="text-sm text-blue-800">
                    {t('apply.payment.howBody', { amount: montant.toLocaleString('fr-FR') })}
                  </p>
                </div>

                {/* Numéro de reçu */}
                <div className="space-y-2">
                  <Label htmlFor="numeroRecuCampost">
                    {t('apply.payment.receiptLabel')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numeroRecuCampost"
                    value={formData.numeroRecuCampost}
                    className={errClass('numeroRecuCampost')}
                    onChange={(e) => { setFormData({ ...formData, numeroRecuCampost: e.target.value }); clearFe('numeroRecuCampost'); }}
                    placeholder={t('apply.payment.receiptPlaceholder')}
                  />
                  {fe('numeroRecuCampost') && <p className="text-sm text-destructive">{fe('numeroRecuCampost')}</p>}
                  <p className="text-xs text-muted-foreground">{t('apply.payment.receiptHint')}</p>
                </div>

                {/* Centre de dépôt — filtré selon config */}
                <div className="space-y-2 pt-2">
                  <Label>
                    {t('apply.documents.center')} <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">{t('apply.documents.centerHint')}</p>
                  
                  <Select
                    value={formData.centreDepotId}
                    onValueChange={(v) => { setFormData({ ...formData, centreDepotId: v }); clearFe('centreDepotId'); }}
                    disabled={centresLoading}
                  >
                    <SelectTrigger className={errClass('centreDepotId')}>
                      <SelectValue placeholder={centresLoading ? t('apply.documents.centerLoading') : t('apply.documents.centerPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {centresVisibles.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom} — {c.ville} ({c.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fe('centreDepotId') && <p className="text-sm text-destructive">{fe('centreDepotId')}</p>}
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Navigation globale (masquée à l'étape 2 — nav interne aux sous-étapes) ── */}
            {currentStep !== 2 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1 || isSubmitting}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {t('common.previous')}
                </Button>

                {currentStep < 5 ? (
                  <Button
                    onClick={handleNext}
                    disabled={currentStep === 1 && !formData.filiere}
                  >
                    {t('common.next')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !formData.numeroRecuCampost.trim()}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('apply.submitting')}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {t('apply.submit')}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {/* ── Barre fixe étape 1 — récap filière sélectionnée ── */}
      {currentStep === 1 && formData.filiere && config && (() => {
        const selected = ACCORDEON_SECTIONS
          .flatMap((a) => a.subSections.flatMap((s) => s.items))
          .find((it) => it.code === formData.filiere);
        return (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[#0A2A66] shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
              {/* Icône check animée */}
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0 ring-2 ring-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              {/* Nom de la filière */}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-400 leading-none mb-0.5 uppercase tracking-wide">
                  Filière sélectionnée / Selected programme
                </p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {selected?.nomFr ?? formData.filiere}
                  {selected?.nomEn && (
                    <span className="font-normal text-gray-400 text-xs"> / {selected.nomEn}</span>
                  )}
                </p>
              </div>
              {/* Prix CAMPOST */}
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">Frais CAMPOST</p>
                <p className="text-base font-bold text-green-600">
                  {montant.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              {/* Bouton Continuer */}
              <Button
                onClick={handleNext}
                className="shrink-0 gap-1.5 bg-[#0A2A66] hover:bg-[#0A2A66]/90 text-white"
              >
                Continuer
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
