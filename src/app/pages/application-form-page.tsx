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
  Download, Loader2, AlertCircle, Languages, MapPin,
  Wifi, Shield, Wrench, ClipboardList, Briefcase, Building2, Check,
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '../components/ui/accordion';
import { toast } from 'sonner';
import { candidatureApi, centresApi, pdfApi } from '../../lib/api';
import type { CentreDepot } from '../../lib/api';
import { LangSwitcher } from '../components/LangSwitcher';
import axios from 'axios';

// ─── Montants par filière (frais CAMPOST à la candidature) ───────────────────
const MONTANTS: Record<string, number> = {
  ITT: 15000, IPT: 15000, TT: 15000, CPT: 15000,
  ITT_ALT: 20000, IPT_ALT: 20000,
  IT: 25000, APT: 25000,
};

// ─── Engagement financier si admis (scolarité CMR / ETR) ─────────────────────
const FIXED_FEES = { inscription: 10000, sport: 10000, assurance: 5000 };
const SCOLARITE: Record<string, { cmr: number; etr: number }> = {
  CPT:     { cmr: 300000, etr: 600000 },
  TT:      { cmr: 300000, etr: 600000 },
  IPT:     { cmr: 500000, etr: 800000 },
  ITT:     { cmr: 500000, etr: 800000 },
  ITT_ALT: { cmr: 500000, etr: 800000 },
  IPT_ALT: { cmr: 500000, etr: 800000 },
  IT:      { cmr: 600000, etr: 1000000 },
  APT:     { cmr: 600000, etr: 1000000 },
};

// ─── Données filières — structure accordéons ─────────────────────────────────
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
  headerBg: string;
  headerText: string;
  borderColor: string;
  subSections: AccordeonSubSection[];
};

const ACCORDEON_SECTIONS: AccordeonSection[] = [
  {
    id: 'classique',
    titleFr: 'Formation classique',
    titleEn: 'Classic training',
    AccIcon: GraduationCap,
    headerBg: 'bg-blue-50 hover:bg-blue-100/60',
    headerText: 'text-blue-900',
    borderColor: 'border-blue-200',
    subSections: [
      {
        titleFr: 'Cycle Licence',
        titleEn: 'Licence Cycle',
        montant: 15000,
        badgeClass: 'bg-green-100 text-green-700 border border-green-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        items: [
          { code: 'ITT', nomFr: 'Ingénieurs des Travaux des Télécommunications',   nomEn: 'Telecommunications Works Engineers',          duree: '3', Icon: Wifi },
          { code: 'IPT', nomFr: 'Inspecteurs des Postes et Télécommunications',    nomEn: 'Posts and Telecommunications Inspectors',     duree: '3', Icon: Shield },
          { code: 'TT',  nomFr: 'Techniciens des Télécommunications',              nomEn: 'Telecommunications Technicians',              duree: '2', Icon: Wrench },
          { code: 'CPT', nomFr: 'Contrôleurs des Postes et Télécommunications',    nomEn: 'Posts and Telecommunications Controllers',    duree: '2', Icon: ClipboardList },
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
          { code: 'IT',  nomFr: 'Ingénieurs des Télécommunications',               nomEn: 'Telecommunications Engineers',                duree: '2', Icon: GraduationCap },
          { code: 'APT', nomFr: 'Administrateurs des Postes et Télécommunications',nomEn: 'Posts and Telecommunications Administrators', duree: '2', Icon: Building2 },
        ],
      },
    ],
  },
  {
    id: 'alternance',
    titleFr: 'Formation par alternance',
    titleEn: 'Work-Study training',
    AccIcon: Briefcase,
    headerBg: 'bg-orange-50 hover:bg-orange-100/60',
    headerText: 'text-orange-900',
    borderColor: 'border-orange-200',
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
          { code: 'ITT_ALT', nomFr: 'ITT — Formation par alternance', nomEn: 'ITT Work-Study training', duree: '3', Icon: Briefcase },
          { code: 'IPT_ALT', nomFr: 'IPT — Formation par alternance', nomEn: 'IPT Work-Study training', duree: '3', Icon: BookOpen },
        ],
      },
    ],
  },
];

// ─── Erreurs par champ ────────────────────────────────────────────────────────
type FieldKey =
  | 'prenom' | 'nom' | 'dateNaissance' | 'lieuNaissance'
  | 'region' | 'ville' | 'nationalite' | 'telephone' | 'email'
  | 'situationMatrimoniale' | 'adresseAnneeScolaire'
  | 'nomPere' | 'regionPere' | 'departementPere'
  | 'nomMere' | 'regionMere' | 'departementMere'
  | 'typeDiplome' | 'serieBac' | 'anneeObtention' | 'etablissement'
  | 'activitesExtraScolaires'
  | 'filiere' | 'langueComposition'
  | 'centreDepotId'
  | 'numeroRecuCampost';

type FieldErrors = Partial<Record<FieldKey, string[]>>;

const STEP_FIELDS: Record<number, FieldKey[]> = {
  1: ['prenom', 'nom', 'dateNaissance', 'lieuNaissance', 'region', 'ville', 'nationalite', 'telephone', 'email',
      'situationMatrimoniale', 'adresseAnneeScolaire', 'nomPere', 'regionPere', 'departementPere', 'nomMere', 'regionMere', 'departementMere'],
  2: ['typeDiplome', 'serieBac', 'anneeObtention', 'etablissement', 'activitesExtraScolaires'],
  3: ['filiere', 'langueComposition'],
  4: ['centreDepotId'],
  5: ['numeroRecuCampost'],
};

type Step = 1 | 2 | 3 | 4 | 5;

// ─── Helper téléchargement PDF ────────────────────────────────────────────────
async function downloadBlob(promise: Promise<{ data: Blob }>, filename: string, onError: () => void) {
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [fieldErrors, setFieldErrors]   = useState<FieldErrors>({});

  const [submittedId,     setSubmittedId]     = useState<string | null>(null);
  const [submittedNumero, setSubmittedNumero] = useState('');

  const [centres, setCentres]               = useState<CentreDepot[]>([]);
  const [centresLoading, setCentresLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Étape 1 — Identité
    prenom: '', nom: '',
    dateNaissance: '', lieuNaissance: '',
    region: '', ville: '',
    nationalite: 'Camerounaise',
    telephone: '', email: '',
    situationMatrimoniale: '' as '' | 'CELIBATAIRE' | 'MARIE',
    adresseAnneeScolaire: '',
    nomPere: '', regionPere: '', departementPere: '',
    nomMere: '', regionMere: '', departementMere: '',
    // Étape 2 — Académique
    typeDiplome: '' as '' | 'BAC' | 'GCE_AL' | 'EQUIVALENT',
    serieBac: '', anneeObtention: '', etablissement: '',
    activitesExtraScolaires: '',
    // Étape 3 — Filière
    filiere: '',
    langueComposition: '' as '' | 'FRANCAIS' | 'ANGLAIS',
    // Étape 4 — Documents + Centre
    centreDepotId: '',
    documents: {
      ACTE_NAISSANCE: null as File | null,
      DIPLOME:        null as File | null,
      PHOTO_IDENTITE: null as File | null,
      CNI:            null as File | null,
    },
    // Étape 5 — Paiement
    numeroRecuCampost: '',
  });

  useEffect(() => {
    setCentresLoading(true);
    centresApi.list()
      .then(({ data }) => setCentres(data.data))
      .catch(() => toast.error(t('apply.documents.centerLoadError')))
      .finally(() => setCentresLoading(false));
  }, [t]);

  const [openAccordion, setOpenAccordion] = useState<string>('classique');
  const selectedCardRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (formData.filiere && selectedCardRef.current) {
      selectedCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [formData.filiere]);

  const montant = MONTANTS[formData.filiere] ?? 15000;

  const steps = [
    { number: 1, title: t('apply.steps.identity'),   icon: User },
    { number: 2, title: t('apply.steps.academic'),   icon: BookOpen },
    { number: 3, title: t('apply.steps.program'),    icon: GraduationCap },
    { number: 4, title: t('apply.steps.documents'),  icon: FileUp },
    { number: 5, title: t('apply.steps.payment'),    icon: Receipt },
  ];

  const progress = (currentStep / 5) * 100;

  const fe = (field: FieldKey) => fieldErrors[field]?.[0];
  const clearFe = (field: FieldKey) =>
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  const errClass = (field: FieldKey) =>
    fe(field) ? 'border-destructive focus-visible:ring-destructive' : '';

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep((s) => (s + 1) as Step);
  };
  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep((s) => (s - 1) as Step);
  };

  const handleFileUpload = (field: keyof typeof formData.documents, file: File | null) => {
    setFormData((prev) => ({ ...prev, documents: { ...prev.documents, [field]: file } }));
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
      if (formData.serieBac)                   payload.serieBac                   = formData.serieBac;
      if (formData.situationMatrimoniale)       payload.situationMatrimoniale       = formData.situationMatrimoniale;
      if (formData.adresseAnneeScolaire)        payload.adresseAnneeScolaire        = formData.adresseAnneeScolaire;
      if (formData.nomPere)                     payload.nomPere                     = formData.nomPere;
      if (formData.regionPere)                  payload.regionPere                  = formData.regionPere;
      if (formData.departementPere)             payload.departementPere             = formData.departementPere;
      if (formData.nomMere)                     payload.nomMere                     = formData.nomMere;
      if (formData.regionMere)                  payload.regionMere                  = formData.regionMere;
      if (formData.departementMere)             payload.departementMere             = formData.departementMere;
      if (formData.activitesExtraScolaires)     payload.activitesExtraScolaires     = formData.activitesExtraScolaires;
      if (formData.langueComposition)           payload.langueComposition           = formData.langueComposition;

      const { data: resp } = await candidatureApi.create(payload);
      const { id, numeroCandidat } = resp.data.candidature;

      const fd = new FormData();
      const { ACTE_NAISSANCE, DIPLOME, PHOTO_IDENTITE, CNI } = formData.documents;
      if (ACTE_NAISSANCE)  fd.append('ACTE_NAISSANCE',  ACTE_NAISSANCE);
      if (DIPLOME)         fd.append('DIPLOME',         DIPLOME);
      if (PHOTO_IDENTITE)  fd.append('PHOTO_IDENTITE',  PHOTO_IDENTITE);
      if (CNI)             fd.append('CNI',             CNI);

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

  // ─── Écran de confirmation post-soumission ───────────────────────────────────
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
                <Button
                  className="flex-1 gap-2"
                  onClick={() => downloadBlob(
                    pdfApi.ficheCandidature(submittedId),
                    `fiche-${submittedNumero}.pdf`,
                    () => toast.error(t('dashboard.downloadError'))
                  )}
                >
                  <Download className="w-4 h-4" />
                  {t('apply.confirmation.downloadFiche')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => downloadBlob(
                    pdfApi.recepisse(submittedId),
                    `recepisse-${submittedNumero}.pdf`,
                    () => toast.error(t('dashboard.downloadError'))
                  )}
                >
                  <Download className="w-4 h-4" />
                  {t('apply.confirmation.downloadRecepisse')}
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

  // ─── Formulaire multi-étapes ─────────────────────────────────────────────────
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
        {/* Progress */}
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

        {/* Step indicators */}
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

        {/* Form card */}
        <Card className="shadow-xl">
          <CardContent className="pt-8">

            {/* ── Étape 1 : Informations personnelles ── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">{t('apply.identity.title')}</h3>
                <div className="grid md:grid-cols-2 gap-6">

                  <div className="space-y-2">
                    <Label htmlFor="prenom">{t('apply.identity.firstName')}</Label>
                    <Input id="prenom" value={formData.prenom} className={errClass('prenom')}
                      onChange={(e) => { setFormData({ ...formData, prenom: e.target.value }); clearFe('prenom'); }} required />
                    {fe('prenom') && <p className="text-sm text-destructive">{fe('prenom')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom">{t('apply.identity.lastName')}</Label>
                    <Input id="nom" value={formData.nom} className={errClass('nom')}
                      onChange={(e) => { setFormData({ ...formData, nom: e.target.value }); clearFe('nom'); }} required />
                    {fe('nom') && <p className="text-sm text-destructive">{fe('nom')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateNaissance">{t('apply.identity.birthDate')}</Label>
                    <Input id="dateNaissance" type="date" value={formData.dateNaissance} className={errClass('dateNaissance')}
                      onChange={(e) => { setFormData({ ...formData, dateNaissance: e.target.value }); clearFe('dateNaissance'); }} required />
                    {fe('dateNaissance') && <p className="text-sm text-destructive">{fe('dateNaissance')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lieuNaissance">{t('apply.identity.birthPlace')}</Label>
                    <Input id="lieuNaissance" value={formData.lieuNaissance} className={errClass('lieuNaissance')}
                      onChange={(e) => { setFormData({ ...formData, lieuNaissance: e.target.value }); clearFe('lieuNaissance'); }} required />
                    {fe('lieuNaissance') && <p className="text-sm text-destructive">{fe('lieuNaissance')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">{t('apply.identity.region')}</Label>
                    <Select value={formData.region}
                      onValueChange={(v) => { setFormData({ ...formData, region: v }); clearFe('region'); }}>
                      <SelectTrigger className={errClass('region')}>
                        <SelectValue placeholder={t('apply.identity.regionPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {fe('region') && <p className="text-sm text-destructive">{fe('region')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ville">{t('apply.identity.city')}</Label>
                    <Input id="ville" value={formData.ville} className={errClass('ville')}
                      onChange={(e) => { setFormData({ ...formData, ville: e.target.value }); clearFe('ville'); }} required />
                    {fe('ville') && <p className="text-sm text-destructive">{fe('ville')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationalite">{t('apply.identity.nationality')}</Label>
                    <Input id="nationalite" value={formData.nationalite} className={errClass('nationalite')}
                      onChange={(e) => { setFormData({ ...formData, nationalite: e.target.value }); clearFe('nationalite'); }} required />
                    {fe('nationalite') && <p className="text-sm text-destructive">{fe('nationalite')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephone">{t('apply.identity.phone')}</Label>
                    <Input id="telephone" type="tel" placeholder={t('apply.identity.phonePlaceholder')}
                      value={formData.telephone} className={errClass('telephone')}
                      onChange={(e) => { setFormData({ ...formData, telephone: e.target.value }); clearFe('telephone'); }} required />
                    {fe('telephone') && <p className="text-sm text-destructive">{fe('telephone')}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">{t('apply.identity.email')}</Label>
                    <Input id="email" type="email" value={formData.email} className={errClass('email')}
                      onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearFe('email'); }} required />
                    {fe('email') && <p className="text-sm text-destructive">{fe('email')}</p>}
                  </div>

                  {/* Situation matrimoniale */}
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t('apply.identity.maritalStatus')}</Label>
                    <div className="flex gap-4">
                      {(['CELIBATAIRE', 'MARIE'] as const).map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => { setFormData({ ...formData, situationMatrimoniale: val }); clearFe('situationMatrimoniale'); }}
                          className={[
                            'flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors',
                            formData.situationMatrimoniale === val
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border text-muted-foreground hover:border-primary/40',
                          ].join(' ')}
                        >
                          {val === 'CELIBATAIRE' ? t('apply.identity.single') : t('apply.identity.married')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Adresse année scolaire */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="adresseAnneeScolaire">{t('apply.identity.academicAddress')}</Label>
                    <Input id="adresseAnneeScolaire" value={formData.adresseAnneeScolaire}
                      onChange={(e) => setFormData({ ...formData, adresseAnneeScolaire: e.target.value })} />
                  </div>

                </div>

                {/* Filiation — Père */}
                <div className="pt-2">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">{t('apply.identity.fatherSection')}</p>
                  <div className="grid md:grid-cols-3 gap-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="departementPere">{t('apply.identity.fatherDept')}</Label>
                      <Input id="departementPere" value={formData.departementPere}
                        onChange={(e) => setFormData({ ...formData, departementPere: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Filiation — Mère */}
                <div className="pt-2">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">{t('apply.identity.motherSection')}</p>
                  <div className="grid md:grid-cols-3 gap-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="departementMere">{t('apply.identity.motherDept')}</Label>
                      <Input id="departementMere" value={formData.departementMere}
                        onChange={(e) => setFormData({ ...formData, departementMere: e.target.value })} />
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ── Étape 2 : Informations académiques ── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">{t('apply.academic.title')}</h3>
                <div className="space-y-6">

                  <div className="space-y-2">
                    <Label>{t('apply.academic.diplomaType')}</Label>
                    <Select value={formData.typeDiplome}
                      onValueChange={(v) => { setFormData({ ...formData, typeDiplome: v as typeof formData.typeDiplome }); clearFe('typeDiplome'); }}>
                      <SelectTrigger className={errClass('typeDiplome')}>
                        <SelectValue placeholder={t('apply.academic.diplomaPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAC">{t('apply.academic.bac')}</SelectItem>
                        <SelectItem value="GCE_AL">{t('apply.academic.gce')}</SelectItem>
                        <SelectItem value="EQUIVALENT">{t('apply.academic.equivalent')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {fe('typeDiplome') && <p className="text-sm text-destructive">{fe('typeDiplome')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('apply.academic.bacSeries')}</Label>
                    <Select value={formData.serieBac}
                      onValueChange={(v) => { setFormData({ ...formData, serieBac: v }); clearFe('serieBac'); }}>
                      <SelectTrigger className={errClass('serieBac')}>
                        <SelectValue placeholder={t('apply.academic.seriesPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                      </SelectContent>
                    </Select>
                    {fe('serieBac') && <p className="text-sm text-destructive">{fe('serieBac')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anneeObtention">{t('apply.academic.year')}</Label>
                    <Input id="anneeObtention" type="number" min="2000" max="2026"
                      value={formData.anneeObtention} className={errClass('anneeObtention')}
                      onChange={(e) => { setFormData({ ...formData, anneeObtention: e.target.value }); clearFe('anneeObtention'); }} required />
                    {fe('anneeObtention') && <p className="text-sm text-destructive">{fe('anneeObtention')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="etablissement">{t('apply.academic.institution')}</Label>
                    <Input id="etablissement" placeholder={t('apply.academic.institutionPlaceholder')}
                      value={formData.etablissement} className={errClass('etablissement')}
                      onChange={(e) => { setFormData({ ...formData, etablissement: e.target.value }); clearFe('etablissement'); }} required />
                    {fe('etablissement') && <p className="text-sm text-destructive">{fe('etablissement')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activitesExtraScolaires">{t('apply.academic.extraActivities')}</Label>
                    <Textarea
                      id="activitesExtraScolaires"
                      placeholder={t('apply.academic.extraActivitiesPlaceholder')}
                      value={formData.activitesExtraScolaires}
                      onChange={(e) => setFormData({ ...formData, activitesExtraScolaires: e.target.value })}
                      rows={3}
                    />
                  </div>

                </div>
              </div>
            )}

            {/* ── Étape 3 : Choix de la filière ── */}
            {currentStep === 3 && (
              <div className="space-y-5 pb-20">
                <h3 className="text-2xl font-bold">{t('apply.programs.title')}</h3>

                {fe('filiere') && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fe('filiere')}</span>
                  </div>
                )}

                {/* ── Accordéons ── */}
                <Accordion
                  type="single"
                  value={openAccordion}
                  onValueChange={(v) => setOpenAccordion(v || openAccordion)}
                  className="space-y-3"
                >
                  {ACCORDEON_SECTIONS.map((acc) => {
                    const isOpen = openAccordion === acc.id;
                    const gradientStyle: React.CSSProperties = {
                      background: acc.id === 'classique'
                        ? 'linear-gradient(135deg, #0A2A66 0%, #1E3E82 100%)'
                        : 'linear-gradient(135deg, #854F0B 0%, #A0621A 100%)',
                    };
                    return (
                      <AccordionItem
                        key={acc.id}
                        value={acc.id}
                        className="rounded-xl overflow-hidden border-0 shadow-md"
                      >
                        {/* Trigger header — dégradé coloré */}
                        <AccordionTrigger
                          className="px-5 py-4 hover:no-underline [&>svg]:text-white [&>svg]:opacity-90 [&>svg]:transition-transform [&>svg]:duration-300"
                          style={gradientStyle}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${isOpen ? 'bg-white/25' : 'bg-white/15'}`}>
                              <acc.AccIcon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-sm md:text-base text-white leading-tight">{acc.titleFr}</p>
                              <p className="text-xs text-white/70 italic">{acc.titleEn}</p>
                            </div>
                          </div>
                        </AccordionTrigger>

                        {/* Content */}
                        <AccordionContent className="px-4 md:px-5 pb-6 pt-4 bg-gray-50/50 border border-t-0 border-gray-200 rounded-b-xl">
                          <div className="space-y-6">
                            {acc.subSections.map((sub) => (
                              <div key={sub.titleFr} className="space-y-3">
                                {/* Sous-section header */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-semibold text-foreground">
                                    {sub.titleFr}
                                    {sub.yaoundeOnly && (
                                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        — Yaoundé uniquement / Yaoundé only
                                      </span>
                                    )}
                                  </h4>
                                </div>

                                {/* Grille cartes — 1 col mobile, 2 col desktop */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {sub.items.map(({ code, nomFr, nomEn, duree, Icon }) => {
                                    const isSelected = formData.filiere === code;
                                    const priceBadgeClass =
                                      sub.montant === 15000 ? 'bg-green-100 text-green-700 border border-green-200' :
                                      sub.montant === 20000 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                              'bg-purple-100 text-purple-700 border border-purple-200';
                                    return (
                                      <button
                                        key={code}
                                        ref={isSelected ? selectedCardRef : undefined}
                                        type="button"
                                        onClick={() => {
                                          setFormData({ ...formData, filiere: code });
                                          clearFe('filiere');
                                        }}
                                        className={[
                                          'relative rounded-xl border-2 p-4 text-left cursor-pointer select-none bg-white w-full',
                                          'transition-all duration-200',
                                          isSelected
                                            ? 'border-[#0A2A66] bg-blue-50/60 shadow-lg ring-2 ring-[#0A2A66]/10'
                                            : 'border-border hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5',
                                        ].join(' ')}
                                      >
                                        {/* Badge prix OU coche selon sélection */}
                                        {isSelected ? (
                                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                          </div>
                                        ) : (
                                          <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${priceBadgeClass}`}>
                                            {sub.montant.toLocaleString('fr-FR')} F
                                          </span>
                                        )}

                                        <div className="flex gap-3 pr-10">
                                          {/* Icône cercle coloré */}
                                          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${sub.iconBg}`}>
                                            <Icon className={`w-5 h-5 ${sub.iconColor}`} />
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                                {code}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                {duree} {t('apply.programs.years')}
                                              </span>
                                            </div>
                                            <p className="text-sm font-semibold leading-snug text-foreground">{nomFr}</p>
                                            <p className="text-xs text-muted-foreground italic mt-0.5 leading-snug">{nomEn}</p>
                                          </div>
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
                    );
                  })}
                </Accordion>

                {/* ── Langue de composition ── */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4 text-primary" />
                    <Label className="font-semibold">{t('apply.programs.langueComposition')}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">{t('apply.programs.langueCompositionHint')}</p>
                  <div className="flex gap-3">
                    {(['FRANCAIS', 'ANGLAIS'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => { setFormData({ ...formData, langueComposition: lang }); clearFe('langueComposition'); }}
                        className={[
                          'flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200',
                          formData.langueComposition === lang
                            ? 'border-primary bg-primary text-white shadow-md'
                            : 'border-border text-muted-foreground hover:border-primary/40 bg-white',
                        ].join(' ')}
                      >
                        {lang === 'FRANCAIS' ? '🇫🇷 Français' : '🇬🇧 English'}
                      </button>
                    ))}
                  </div>
                  {fe('langueComposition') && <p className="text-sm text-destructive">{fe('langueComposition')}</p>}
                </div>

                {/* ── Tableau engagement financier si admis ── */}
                {formData.filiere && SCOLARITE[formData.filiere] && (() => {
                  const sc = SCOLARITE[formData.filiere];
                  const fixedTotal = FIXED_FEES.inscription + FIXED_FEES.sport + FIXED_FEES.assurance;
                  const totalCmr = fixedTotal + sc.cmr;
                  const totalEtr = fixedTotal + sc.etr;
                  return (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 md:p-5 space-y-3">
                      <p className="text-sm font-bold text-amber-900">
                        Si admis, frais annuels à régler{' '}
                        <span className="font-normal italic">/ If admitted, annual fees to pay</span>
                      </p>
                      {/* Scroll horizontal sur mobile */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[380px]">
                          <thead>
                            <tr className="text-xs font-bold text-amber-900 border-b-2 border-amber-200">
                              <th className="text-left pb-2 pr-4">Frais</th>
                              <th className="text-right pb-2 px-2 whitespace-nowrap">Camerounais</th>
                              <th className="text-right pb-2 pl-2 whitespace-nowrap">Étranger / Foreigner</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-amber-100">
                            {[
                              { label: 'Inscription / Registration fees', cmr: FIXED_FEES.inscription, etr: FIXED_FEES.inscription },
                              { label: 'Activités sport / culture',       cmr: FIXED_FEES.sport,       etr: FIXED_FEES.sport },
                              { label: 'Assurance / Insurance',           cmr: FIXED_FEES.assurance,   etr: FIXED_FEES.assurance },
                              { label: 'Scolarité / Tuition',             cmr: sc.cmr,                 etr: sc.etr },
                            ].map(({ label, cmr, etr }) => (
                              <tr key={label} className="text-amber-800">
                                <td className="py-2 pr-4">{label}</td>
                                <td className="py-2 px-2 text-right font-medium tabular-nums">{cmr.toLocaleString('fr-FR')}</td>
                                <td className="py-2 pl-2 text-right font-medium tabular-nums">{etr.toLocaleString('fr-FR')}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-bold text-amber-900 border-t-2 border-amber-300">
                              <td className="pt-2.5 pr-4">TOTAL (FCFA)</td>
                              <td className="pt-2.5 px-2 text-right tabular-nums">{totalCmr.toLocaleString('fr-FR')}</td>
                              <td className="pt-2.5 pl-2 text-right tabular-nums">{totalEtr.toLocaleString('fr-FR')}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                      <p className="text-xs text-amber-700 italic border-t border-amber-200 pt-2">
                        Ces frais sont dus uniquement en cas d'admission / These fees are due only upon admission.
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ── Étape 4 : Documents + Centre de dépôt ── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">{t('apply.documents.title')}</h3>

                <div className="space-y-4">
                  {([
                    { field: 'ACTE_NAISSANCE' as const, labelKey: 'apply.documents.birthCert', accept: '.pdf,.jpg,.png' },
                    { field: 'DIPLOME'         as const, labelKey: 'apply.documents.diploma',   accept: '.pdf,.jpg,.png' },
                    { field: 'PHOTO_IDENTITE'  as const, labelKey: 'apply.documents.photo',     accept: '.jpg,.png' },
                    { field: 'CNI'             as const, labelKey: 'apply.documents.cni',       accept: '.pdf,.jpg,.png' },
                  ]).map(({ field, labelKey, accept }) => (
                    <div key={field}
                      className="border-2 border-dashed rounded-lg p-5 hover:border-primary transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            formData.documents[field] ? 'bg-green-100' : 'bg-primary/10'
                          }`}>
                            {formData.documents[field]
                              ? <CheckCircle className="w-5 h-5 text-green-600" />
                              : <Upload className="w-5 h-5 text-primary" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-sm">{t(labelKey)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formData.documents[field]
                                ? formData.documents[field]!.name
                                : t('apply.documents.fileHint')}
                            </p>
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm"
                          onClick={() => document.getElementById(`file-${field}`)?.click()}>
                          {formData.documents[field] ? t('apply.documents.change') : t('apply.documents.choose')}
                        </Button>
                      </div>
                      <input id={`file-${field}`} type="file" accept={accept} className="hidden"
                        onChange={(e) => handleFileUpload(field, e.target.files?.[0] ?? null)} />
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">{t('apply.documents.sizeWarning')}</p>
                </div>

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
                      {centres.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom} — {c.ville} ({c.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fe('centreDepotId') && <p className="text-sm text-destructive">{fe('centreDepotId')}</p>}
                </div>
              </div>
            )}

            {/* ── Étape 5 : Paiement CAMPOST ── */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">{t('apply.payment.title')}</h3>

                <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">{t('apply.payment.selectedProgram')}</p>
                      <p className="text-lg font-semibold opacity-95">{formData.filiere || '—'}</p>
                      <p className="text-xs opacity-75 mt-1">{t('apply.payment.fees')}</p>
                      <p className="text-4xl font-bold mt-1">
                        {montant.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                    <Receipt className="w-16 h-16 opacity-40" />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-2">
                  <p className="text-sm font-semibold text-blue-900">{t('apply.payment.howTitle')}</p>
                  <p className="text-sm text-blue-800">
                    {t('apply.payment.howBody', { amount: montant.toLocaleString('fr-FR') })}
                  </p>
                </div>

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
                    required
                  />
                  {fe('numeroRecuCampost') && <p className="text-sm text-destructive">{fe('numeroRecuCampost')}</p>}
                  <p className="text-xs text-muted-foreground">{t('apply.payment.receiptHint')}</p>
                </div>

                {submitError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isSubmitting}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t('common.previous')}
              </Button>

              {currentStep < 5 ? (
                <Button onClick={handleNext}>
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

          </CardContent>
        </Card>
      </div>

      {/* ── Barre fixe étape 3 — récap filière sélectionnée ── */}
      {currentStep === 3 && formData.filiere && (() => {
        const selected = ACCORDEON_SECTIONS
          .flatMap((a) => a.subSections.flatMap((s) => s.items))
          .find((it) => it.code === formData.filiere);
        return (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl">
            <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground leading-none mb-0.5">Filière sélectionnée</p>
                <p className="text-sm font-bold text-foreground truncate">
                  {selected?.nomFr ?? formData.filiere}
                  {selected?.nomEn && (
                    <span className="font-normal text-muted-foreground"> / {selected.nomEn}</span>
                  )}
                </p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-xs text-muted-foreground">Frais CAMPOST</p>
                <p className="text-base font-bold text-green-600">
                  {(MONTANTS[formData.filiere] ?? 0).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              <Button
                onClick={handleNext}
                className="shrink-0 gap-1.5"
                style={{ background: 'linear-gradient(135deg, #0A2A66 0%, #1E3E82 100%)' }}
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
