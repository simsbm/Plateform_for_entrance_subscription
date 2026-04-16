import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Progress } from '../components/ui/progress';
import {
  GraduationCap, User, BookOpen, FileUp, Receipt,
  ChevronLeft, ChevronRight, Upload, CheckCircle,
  Download, Loader2, AlertCircle,
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
  const [submitError, setSubmitError] = useState<string | null>(null);

  // État post-soumission
  const [submittedId,     setSubmittedId]     = useState<string | null>(null);
  const [submittedNumero, setSubmittedNumero] = useState('');

  // Centres de dépôt
  const [centres, setCentres]       = useState<CentreDepot[]>([]);
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
    { number: 1, title: 'Identité',     icon: User },
    { number: 2, title: 'Académique',   icon: BookOpen },
    { number: 3, title: 'Filière',      icon: GraduationCap },
    { number: 4, title: 'Documents',    icon: FileUp },
    { number: 5, title: 'Paiement',     icon: Receipt },
  ];

  const progress = (currentStep / 5) * 100;

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
      toast.error('Veuillez saisir le numéro de reçu CAMPOST');
      return;
    }
    setSubmitError(null);
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
        const msg  = body?.message ?? 'Erreur lors de la soumission';
        setSubmitError(msg);
        toast.error(msg);
      } else {
        setSubmitError('Erreur inattendue');
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
                    <Input id="prenom" value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nom">Nom</Label>
                    <Input id="nom" value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateNaissance">Date de naissance</Label>
                    <Input id="dateNaissance" type="date" value={formData.dateNaissance}
                      onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
                    <Input id="lieuNaissance" value={formData.lieuNaissance}
                      onChange={(e) => setFormData({ ...formData, lieuNaissance: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Région</Label>
                    <Select value={formData.region}
                      onValueChange={(v) => setFormData({ ...formData, region: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner une région" /></SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ville">Ville</Label>
                    <Input id="ville" value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationalite">Nationalité</Label>
                    <Input id="nationalite" value={formData.nationalite}
                      onChange={(e) => setFormData({ ...formData, nationalite: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input id="telephone" type="tel" placeholder="+237 6XX XXX XXX"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">Adresse e-mail</Label>
                    <Input id="email" type="email" value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
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
                      onValueChange={(v) => setFormData({ ...formData, typeDiplome: v as typeof formData.typeDiplome })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner un type de diplôme" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAC">Baccalauréat</SelectItem>
                        <SelectItem value="GCE_AL">GCE Advanced Level</SelectItem>
                        <SelectItem value="EQUIVALENT">Diplôme équivalent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Série du Baccalauréat</Label>
                    <Select value={formData.serieBac}
                      onValueChange={(v) => setFormData({ ...formData, serieBac: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner une série" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="C">Série C (Mathématiques & Physique)</SelectItem>
                        <SelectItem value="D">Série D (Mathématiques & Sciences Naturelles)</SelectItem>
                        <SelectItem value="E">Série E (Mathématiques & Technologie)</SelectItem>
                        <SelectItem value="F">Série F (Technique Industrielle)</SelectItem>
                        <SelectItem value="A">Série A (Lettres)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anneeObtention">Année d'obtention</Label>
                    <Input id="anneeObtention" type="number" min="2000" max="2026"
                      value={formData.anneeObtention}
                      onChange={(e) => setFormData({ ...formData, anneeObtention: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="etablissement">Établissement d'obtention</Label>
                    <Input id="etablissement" placeholder="Nom de l'établissement"
                      value={formData.etablissement}
                      onChange={(e) => setFormData({ ...formData, etablissement: e.target.value })} required />
                  </div>
                </div>
              </div>
            )}

            {/* ── Étape 3 : Choix de la filière ── */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">Choix de la filière</h3>
                <RadioGroup value={formData.filiere}
                  onValueChange={(v) => setFormData({ ...formData, filiere: v })}>

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Licence — Session principale (15 000 FCFA)
                  </p>
                  {[
                    { value: 'ITT', label: 'ITT — Ingénieurs des Travaux des Télécommunications', desc: "Formation d'ingénieurs en télécommunications (3 ans)" },
                    { value: 'IPT', label: 'IPT — Inspecteurs des Postes et Télécommunications', desc: "Formation d'inspecteurs P&T (3 ans)" },
                    { value: 'TT',  label: 'TT — Techniciens des Télécommunications', desc: 'Formation de techniciens télécom (2 ans)' },
                    { value: 'CPT', label: 'CPT — Contrôleurs des Postes et Télécommunications', desc: "Formation d'agents de contrôle P&T (2 ans)" },
                  ].map(({ value, label, desc }) => (
                    <div key={value} className="border rounded-lg p-5 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value={value} id={value} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={value} className="text-base font-bold cursor-pointer">{label}</Label>
                          <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">
                    Licence Alternance — Yaoundé uniquement (20 000 FCFA)
                  </p>
                  {[
                    { value: 'ITT_ALT', label: 'ITT Alternance', desc: 'ITT en contrat d\'alternance — Yaoundé uniquement' },
                    { value: 'IPT_ALT', label: 'IPT Alternance', desc: 'IPT en contrat d\'alternance — Yaoundé uniquement' },
                  ].map(({ value, label, desc }) => (
                    <div key={value} className="border rounded-lg p-5 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value={value} id={value} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={value} className="text-base font-bold cursor-pointer">{label}</Label>
                          <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">
                    Master — Yaoundé uniquement (25 000 FCFA)
                  </p>
                  {[
                    { value: 'IT',  label: 'IT — Ingénieurs des Télécommunications (Master)', desc: 'Formation Master en télécommunications — Yaoundé uniquement' },
                    { value: 'APT', label: 'APT — Administrateurs des Postes et Télécommunications (Master)', desc: 'Formation Master en administration P&T — Yaoundé uniquement' },
                  ].map(({ value, label, desc }) => (
                    <div key={value} className="border rounded-lg p-5 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value={value} id={value} className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor={value} className="text-base font-bold cursor-pointer">{label}</Label>
                          <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* ── Étape 4 : Documents + Centre de dépôt ── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">Pièces justificatives & Centre de dépôt</h3>

                {/* Documents */}
                <div className="space-y-4">
                  {([
                    { field: 'ACTE_NAISSANCE' as const, label: 'Acte de naissance',           accept: '.pdf,.jpg,.png' },
                    { field: 'DIPLOME'         as const, label: 'Diplôme du Baccalauréat',     accept: '.pdf,.jpg,.png' },
                    { field: 'PHOTO_IDENTITE'  as const, label: 'Photo d\'identité (4×4)',      accept: '.jpg,.png' },
                    { field: 'CNI'             as const, label: 'Carte Nationale d\'Identité', accept: '.pdf,.jpg,.png' },
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
                    onValueChange={(v) => setFormData({ ...formData, centreDepotId: v })}
                    disabled={centresLoading}
                  >
                    <SelectTrigger>
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
                    onChange={(e) => setFormData({ ...formData, numeroRecuCampost: e.target.value })}
                    placeholder="Ex : 0012345678"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Ce numéro figure sur le reçu remis par l'agent CAMPOST lors de votre versement.
                  </p>
                </div>

                {/* Erreur de soumission */}
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
