import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import {
  GraduationCap, User, BookOpen, FileUp, Receipt,
  ChevronLeft, ChevronRight, Upload, CheckCircle,
  Download, Loader2, AlertCircle,
  Wifi, Shield, Wrench, ClipboardList, Briefcase, Building2, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { candidatureApi, centresApi, pdfApi } from '../../lib/api';
import type { CentreDepot } from '../../lib/api';
import axios from 'axios';

// ─── Montants par filière ─────────────────────────────────────────────────────
const MONTANTS: Record<string, number> = {
  ITT: 15000, IPT: 15000, TT: 15000, CPT: 15000,
  ITT_ALT: 20000, IPT_ALT: 20000,
  IT: 25000, APT: 25000,
};

// ─── Données filières pour l'étape 3 ─────────────────────────────────────────
type FiliereItem = {
  code: string;
  nom: string;
  desc: string;
  duree: string;
  Icon: React.ElementType;
};
type FiliereGroupe = {
  titre: string;
  montant: number;
  badgeClass: string;
  bgGroupe: string;
  iconBg: string;
  iconColor: string;
  items: FiliereItem[];
};

const FILIERE_GROUPES: FiliereGroupe[] = [
  {
    titre: 'Cycle Licence ',
    montant: 15000,
    badgeClass: 'bg-green-100 text-green-700',
    bgGroupe: 'bg-muted/30',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    items: [
      { code: 'ITT', nom: "Ingénieurs des Travaux des Télécommunications",  desc: "Formation d'ingénieurs en télécommunications", duree: '3 ans', Icon: Wifi },
      { code: 'IPT', nom: "Inspecteurs des Postes et Télécommunications",    desc: "Formation d'inspecteurs P&T",                 duree: '3 ans', Icon: Shield },
      { code: 'TT',  nom: "Techniciens des Télécommunications",              desc: 'Formation de techniciens télécom',            duree: '2 ans', Icon: Wrench },
      { code: 'CPT', nom: "Contrôleurs des Postes et Télécommunications",    desc: "Formation d'agents de contrôle P&T",          duree: '2 ans', Icon: ClipboardList },
    ],
  },
  {
    titre: 'Cycle Licence - Formation par alternance (Yaoundé uniquement)',
    montant: 20000,
    badgeClass: 'bg-orange-100 text-orange-700',
    bgGroupe: 'bg-orange-50',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    items: [
      { code: 'ITT_ALT', nom: "ITT — Ingénieurs des Travaux Télécommunications Alternance", desc: "Formation ITT en contrat d'alternance, Yaoundé uniquement", duree: '3 ans', Icon: Briefcase },
      { code: 'IPT_ALT', nom: "IPT — Inspecteurs des Postes et Télécommunications Alternance", desc: "Formation IPT en contrat d'alternance, Yaoundé uniquement", duree: '3 ans', Icon: BookOpen },
    ],
  },
  {
    titre: 'Cycle Master (Yaoundé uniquement)',
    montant: 25000,
    badgeClass: 'bg-purple-100 text-purple-700',
    bgGroupe: 'bg-purple-50',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    items: [
      { code: 'IT',  nom: "Ingénieurs des Télécommunications",                desc: 'Formation Master en télécommunications, Yaoundé uniquement',  duree: '2 ans', Icon: GraduationCap },
      { code: 'APT', nom: "Administrateurs des Postes et Télécommunications", desc: 'Formation Master en administration P&T, Yaoundé uniquement', duree: '2 ans', Icon: Building2 },
    ],
  },
];

// ─── Erreurs par champ ────────────────────────────────────────────────────────
type FieldKey =
  | 'prenom' | 'nom' | 'dateNaissance' | 'lieuNaissance'
  | 'region' | 'ville' | 'nationalite' | 'telephone' | 'email'
  | 'typeDiplome' | 'serieBac' | 'anneeObtention' | 'etablissement'
  | 'filiere'
  | 'centreDepotId'
  | 'numeroRecuCampost';

type FieldErrors = Partial<Record<FieldKey, string[]>>;

const STEP_FIELDS: Record<number, FieldKey[]> = {
  1: ['prenom', 'nom', 'dateNaissance', 'lieuNaissance', 'region', 'ville', 'nationalite', 'telephone', 'email'],
  2: ['typeDiplome', 'serieBac', 'anneeObtention', 'etablissement'],
  3: ['filiere'],
  4: ['centreDepotId'],
  5: ['numeroRecuCampost'],
};

type Step = 1 | 2 | 3 | 4 | 5;

// ─── Helper téléchargement PDF ────────────────────────────────────────────────
async function downloadBlob(promise: Promise<{ data: Blob }>, filename: string) {
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
    toast.error('Erreur lors du téléchargement du PDF');
  }
}

// ─── Composant principal ──────────────────────────────────────────────────────
export function ApplicationFormPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [fieldErrors, setFieldErrors]   = useState<FieldErrors>({});

  // État post-soumission
  const [submittedId,     setSubmittedId]     = useState<string | null>(null);
  const [submittedNumero, setSubmittedNumero] = useState('');

  // Centres de dépôt
  const [centres, setCentres]               = useState<CentreDepot[]>([]);
  const [centresLoading, setCentresLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Étape 1 — Infos personnelles
    prenom: '', nom: '',
    dateNaissance: '', lieuNaissance: '',
    region: '', ville: '',
    nationalite: 'Camerounaise',
    telephone: '', email: '',
    // Étape 2 — Infos académiques
    typeDiplome: '' as '' | 'BAC' | 'GCE_AL' | 'EQUIVALENT',
    serieBac: '', anneeObtention: '', etablissement: '',
    // Étape 3 — Filière
    filiere: '',
    // Étape 4 — Documents + Centre
    centreDepotId: '',
    documents: {
      ACTE_NAISSANCE: null as File | null,
      DIPLOME:        null as File | null,
      PHOTO_IDENTITE: null as File | null,
      CNI:            null as File | null,
    },
    // Étape 5 — Paiement CAMPOST
    numeroRecuCampost: '',
  });

  // Chargement des centres au montage
  useEffect(() => {
    setCentresLoading(true);
    centresApi.list()
      .then(({ data }) => setCentres(data.data))
      .catch(() => toast.error('Impossible de charger les centres de dépôt'))
      .finally(() => setCentresLoading(false));
  }, []);

  const montant = MONTANTS[formData.filiere] ?? 15000;

  const steps = [
    { number: 1, title: 'Identité',   icon: User },
    { number: 2, title: 'Académique', icon: BookOpen },
    { number: 3, title: 'Filière',    icon: GraduationCap },
    { number: 4, title: 'Documents',  icon: FileUp },
    { number: 5, title: 'Paiement',   icon: Receipt },
  ];

  const progress = (currentStep / 5) * 100;

  // ─── Helpers erreurs ──────────────────────────────────────────────────────
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

  // ─── Soumission ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.numeroRecuCampost.trim()) {
      setFieldErrors({ numeroRecuCampost: ['Veuillez saisir le numéro de reçu CAMPOST'] });
      return;
    }
    setSubmitError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      // 1. Créer la candidature (JSON)
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
      if (formData.serieBac) payload.serieBac = formData.serieBac;

      const { data: resp } = await candidatureApi.create(payload);
      const { id, numeroCandidat } = resp.data.candidature;

      // 2. Upload les pièces justificatives
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
      toast.success('Candidature soumise avec succès !');

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const body = err.response?.data;

        if (body?.errors) {
          // Erreurs champ par champ → naviguer vers l'étape concernée
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
          toast.error('Veuillez corriger les erreurs dans le formulaire');
        } else {
          const msg = body?.message ?? 'Erreur lors de la soumission';
          setSubmitError(msg);
          toast.error(msg);
        }
      } else {
        setSubmitError('Une erreur inattendue est survenue');
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
              <h2 className="text-2xl font-bold text-green-700">Candidature soumise !</h2>
              <p className="text-muted-foreground mt-2">
                Votre dossier a été enregistré avec succès.
              </p>
            </div>

            <div className="bg-muted rounded-lg px-6 py-4 text-left space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Numéro de candidat</p>
              <p className="text-2xl font-mono font-bold text-primary">{submittedNumero}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Conservez ce numéro — il vous sera demandé lors du dépôt physique.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Téléchargez vos documents :</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 gap-2"
                  onClick={() => downloadBlob(
                    pdfApi.ficheCandidature(submittedId),
                    `fiche-${submittedNumero}.pdf`
                  )}
                >
                  <Download className="w-4 h-4" />
                  Fiche de candidature
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => downloadBlob(
                    pdfApi.recepisse(submittedId),
                    `recepisse-${submittedNumero}.pdf`
                  )}
                >
                  <Download className="w-4 h-4" />
                  Récépissé de dépôt
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate('/dashboard')}
            >
              Accéder à mon tableau de bord
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-18 h-18 rounded-lg flex items-center justify-center">
              <img src="src\img\cropped-logo-supptic.png" alt="logo of supptic" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">Formulaire de candidature SUPPTIC</h1>
              <p className="text-xs text-muted-foreground">Complétez toutes les étapes pour soumettre votre dossier</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Étape {currentStep} / 5</h2>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% complété</span>
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
                <h3 className="text-2xl font-bold mb-6">Informations personnelles</h3>
                <div className="grid md:grid-cols-2 gap-6">

                  <div className="space-y-2">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input id="prenom" value={formData.prenom} className={errClass('prenom')}
                      onChange={(e) => { setFormData({ ...formData, prenom: e.target.value }); clearFe('prenom'); }} required />
                    {fe('prenom') && <p className="text-sm text-destructive">{fe('prenom')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" value={formData.nom} className={errClass('nom')}
                      onChange={(e) => { setFormData({ ...formData, nom: e.target.value }); clearFe('nom'); }} required />
                    {fe('nom') && <p className="text-sm text-destructive">{fe('nom')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateNaissance">Date de naissance</Label>
                    <Input id="dateNaissance" type="date" value={formData.dateNaissance} className={errClass('dateNaissance')}
                      onChange={(e) => { setFormData({ ...formData, dateNaissance: e.target.value }); clearFe('dateNaissance'); }} required />
                    {fe('dateNaissance') && <p className="text-sm text-destructive">{fe('dateNaissance')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
                    <Input id="lieuNaissance" value={formData.lieuNaissance} className={errClass('lieuNaissance')}
                      onChange={(e) => { setFormData({ ...formData, lieuNaissance: e.target.value }); clearFe('lieuNaissance'); }} required />
                    {fe('lieuNaissance') && <p className="text-sm text-destructive">{fe('lieuNaissance')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Région</Label>
                    <Select value={formData.region}
                      onValueChange={(v) => { setFormData({ ...formData, region: v }); clearFe('region'); }}>
                      <SelectTrigger className={errClass('region')}>
                        <SelectValue placeholder="Sélectionner une région" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {fe('region') && <p className="text-sm text-destructive">{fe('region')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ville">Ville</Label>
                    <Input id="ville" value={formData.ville} className={errClass('ville')}
                      onChange={(e) => { setFormData({ ...formData, ville: e.target.value }); clearFe('ville'); }} required />
                    {fe('ville') && <p className="text-sm text-destructive">{fe('ville')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationalite">Nationalité</Label>
                    <Input id="nationalite" value={formData.nationalite} className={errClass('nationalite')}
                      onChange={(e) => { setFormData({ ...formData, nationalite: e.target.value }); clearFe('nationalite'); }} required />
                    {fe('nationalite') && <p className="text-sm text-destructive">{fe('nationalite')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input id="telephone" type="tel" placeholder="+237 6XX XXX XXX"
                      value={formData.telephone} className={errClass('telephone')}
                      onChange={(e) => { setFormData({ ...formData, telephone: e.target.value }); clearFe('telephone'); }} required />
                    {fe('telephone') && <p className="text-sm text-destructive">{fe('telephone')}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">Adresse e-mail</Label>
                    <Input id="email" type="email" value={formData.email} className={errClass('email')}
                      onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clearFe('email'); }} required />
                    {fe('email') && <p className="text-sm text-destructive">{fe('email')}</p>}
                  </div>

                </div>
              </div>
            )}

            {/* ── Étape 2 : Informations académiques ── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">Informations académiques</h3>
                <div className="space-y-6">

                  <div className="space-y-2">
                    <Label>Type de diplôme</Label>
                    <Select value={formData.typeDiplome}
                      onValueChange={(v) => { setFormData({ ...formData, typeDiplome: v as typeof formData.typeDiplome }); clearFe('typeDiplome'); }}>
                      <SelectTrigger className={errClass('typeDiplome')}>
                        <SelectValue placeholder="Sélectionner un type de diplôme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAC">Baccalauréat</SelectItem>
                        <SelectItem value="GCE_AL">GCE Advanced Level</SelectItem>
                        <SelectItem value="EQUIVALENT">Diplôme équivalent</SelectItem>
                      </SelectContent>
                    </Select>
                    {fe('typeDiplome') && <p className="text-sm text-destructive">{fe('typeDiplome')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Série du Baccalauréat</Label>
                    <Select value={formData.serieBac}
                      onValueChange={(v) => { setFormData({ ...formData, serieBac: v }); clearFe('serieBac'); }}>
                      <SelectTrigger className={errClass('serieBac')}>
                        <SelectValue placeholder="Sélectionner une série" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C">Série C (Mathématiques & Physique)</SelectItem>
                        <SelectItem value="D">Série D (Mathématiques & Sciences Naturelles)</SelectItem>
                        <SelectItem value="E">Série E (Mathématiques & Technologie)</SelectItem>
                        <SelectItem value="F">Série F (Technique Industrielle)</SelectItem>
                        <SelectItem value="A">Série A (Lettres)</SelectItem>
                      </SelectContent>
                    </Select>
                    {fe('serieBac') && <p className="text-sm text-destructive">{fe('serieBac')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="anneeObtention">Année d'obtention</Label>
                    <Input id="anneeObtention" type="number" min="2000" max="2026"
                      value={formData.anneeObtention} className={errClass('anneeObtention')}
                      onChange={(e) => { setFormData({ ...formData, anneeObtention: e.target.value }); clearFe('anneeObtention'); }} required />
                    {fe('anneeObtention') && <p className="text-sm text-destructive">{fe('anneeObtention')}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="etablissement">Établissement d'obtention</Label>
                    <Input id="etablissement" placeholder="Nom de l'établissement"
                      value={formData.etablissement} className={errClass('etablissement')}
                      onChange={(e) => { setFormData({ ...formData, etablissement: e.target.value }); clearFe('etablissement'); }} required />
                    {fe('etablissement') && <p className="text-sm text-destructive">{fe('etablissement')}</p>}
                  </div>

                </div>
              </div>
            )}

            {/* ── Étape 3 : Choix de la filière ── */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">Choix de la filière</h3>

                {fe('filiere') && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{fe('filiere')}</span>
                  </div>
                )}

                {FILIERE_GROUPES.map((groupe) => (
                  <div key={groupe.titre} className={`rounded-xl p-5 space-y-4 ${groupe.bgGroupe}`}>

                    {/* En-tête du groupe */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-foreground">{groupe.titre}</h4>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${groupe.badgeClass}`}>
                        {groupe.montant.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>

                    {/* Grille 2 colonnes desktop / 1 mobile */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupe.items.map(({ code, nom, desc, duree, Icon }) => {
                        const isSelected = formData.filiere === code;
                        return (
                          <div
                            key={code}
                            onClick={() => { setFormData({ ...formData, filiere: code }); clearFe('filiere'); }}
                            className={[
                              'relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-150 select-none bg-white',
                              isSelected
                                ? 'border-primary shadow-md'
                                : 'border-border hover:border-primary/50 hover:shadow-sm',
                            ].join(' ')}
                          >
                            {/* Coche de sélection */}
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                              </div>
                            )}

                            <div className="flex gap-3">
                              {/* Icône */}
                              <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${groupe.iconBg}`}>
                                <Icon className={`w-5 h-5 ${groupe.iconColor}`} />
                              </div>

                              <div className="flex-1 min-w-0 pr-4">
                                {/* Code badge + durée */}
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                    {code}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{duree}</span>
                                </div>

                                {/* Nom complet */}
                                <p className="text-sm font-semibold leading-snug">{nom}</p>

                                {/* Description */}
                                <p className="text-xs text-muted-foreground mt-1">{desc}</p>

                                {/* Montant */}
                                <p className="text-sm font-bold text-green-600 mt-2">
                                  {groupe.montant.toLocaleString('fr-FR')} FCFA
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Récapitulatif filière sélectionnée */}
                {formData.filiere && (
                  <div className="flex items-center justify-between gap-4 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Filière sélectionnée</p>
                        <p className="font-semibold text-primary">{formData.filiere}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Frais à verser à la CAMPOST</p>
                      <p className="text-xl font-bold text-green-600">
                        {(MONTANTS[formData.filiere] ?? 0).toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Étape 4 : Documents + Centre de dépôt ── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">Pièces justificatives & Centre de dépôt</h3>

                {/* Documents */}
                <div className="space-y-4">
                  {([
                    { field: 'ACTE_NAISSANCE' as const, label: "Acte de naissance",           accept: '.pdf,.jpg,.png' },
                    { field: 'DIPLOME'         as const, label: "Diplôme du Baccalauréat",     accept: '.pdf,.jpg,.png' },
                    { field: 'PHOTO_IDENTITE'  as const, label: "Photo d'identité (4×4)",      accept: '.jpg,.png' },
                    { field: 'CNI'             as const, label: "Carte Nationale d'Identité",  accept: '.pdf,.jpg,.png' },
                  ]).map(({ field, label, accept }) => (
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
                            <p className="font-medium text-sm">{label}</p>
                            <p className="text-xs text-muted-foreground">
                              {formData.documents[field]
                                ? formData.documents[field]!.name
                                : 'PDF, JPG ou PNG (max 5 Mo)'}
                            </p>
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm"
                          onClick={() => document.getElementById(`file-${field}`)?.click()}>
                          {formData.documents[field] ? 'Changer' : 'Choisir'}
                        </Button>
                      </div>
                      <input id={`file-${field}`} type="file" accept={accept} className="hidden"
                        onChange={(e) => handleFileUpload(field, e.target.files?.[0] ?? null)} />
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Important :</strong> Tous les documents doivent être lisibles. Taille maximale : 5 Mo par fichier.
                  </p>
                </div>

                {/* Centre de dépôt */}
                <div className="space-y-2 pt-2">
                  <Label>Centre de dépôt physique <span className="text-destructive">*</span></Label>
                  <p className="text-xs text-muted-foreground">
                    Choisissez le bureau CAMPOST où vous déposerez votre dossier physique.
                  </p>
                  <Select
                    value={formData.centreDepotId}
                    onValueChange={(v) => { setFormData({ ...formData, centreDepotId: v }); clearFe('centreDepotId'); }}
                    disabled={centresLoading}
                  >
                    <SelectTrigger className={errClass('centreDepotId')}>
                      <SelectValue placeholder={centresLoading ? 'Chargement…' : 'Sélectionner un centre'} />
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
                <h3 className="text-2xl font-bold mb-6">Paiement des frais de dossier</h3>

                {/* Bandeau montant dynamique */}
                <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-80">Filière sélectionnée</p>
                      <p className="text-lg font-semibold opacity-95">{formData.filiere || '—'}</p>
                      <p className="text-xs opacity-75 mt-1">Frais de dossier</p>
                      <p className="text-4xl font-bold mt-1">
                        {montant.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                    <Receipt className="w-16 h-16 opacity-40" />
                  </div>
                </div>

                {/* Instructions CAMPOST */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-2">
                  <p className="text-sm font-semibold text-blue-900">Comment payer ?</p>
                  <p className="text-sm text-blue-800">
                    Effectuez votre versement de{' '}
                    <strong>{montant.toLocaleString('fr-FR')} FCFA</strong> auprès de tout bureau{' '}
                    <strong>CAMPOST</strong> au profit de l'
                    <strong>Agent Comptable de SUP'PTIC</strong>
                    {' '}(compte N°&nbsp;<strong>150657330-19</strong>),
                    puis saisissez le numéro figurant sur votre reçu ci-dessous.
                  </p>
                </div>

                {/* Champ reçu CAMPOST */}
                <div className="space-y-2">
                  <Label htmlFor="numeroRecuCampost">
                    Numéro de reçu CAMPOST <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numeroRecuCampost"
                    value={formData.numeroRecuCampost}
                    className={errClass('numeroRecuCampost')}
                    onChange={(e) => { setFormData({ ...formData, numeroRecuCampost: e.target.value }); clearFe('numeroRecuCampost'); }}
                    placeholder="Ex : 0012345678"
                    required
                  />
                  {fe('numeroRecuCampost') && <p className="text-sm text-destructive">{fe('numeroRecuCampost')}</p>}
                  <p className="text-xs text-muted-foreground">
                    Ce numéro figure sur le reçu remis par l'agent CAMPOST lors de votre versement.
                  </p>
                </div>

                {/* Erreur globale de soumission */}
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
                Précédent
              </Button>

              {currentStep < 5 ? (
                <Button onClick={handleNext}>
                  Suivant
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
                      Soumission en cours…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Soumettre ma candidature
                    </>
                  )}
                </Button>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
