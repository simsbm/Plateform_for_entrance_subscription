import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  GraduationCap, Download, FileText, CheckCircle,
  AlertCircle, MapPin, User, LogOut, Loader2, XCircle,
  BadgeCheck, Hourglass,
} from 'lucide-react';
import { toast } from 'sonner';
import { candidatureApi, pdfApi, clearAuth } from '../../lib/api';
import type { StatutDossier } from '../../lib/api';
import { LangSwitcher } from '../components/LangSwitcher';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidatureMe {
  id: string;
  numeroCandidat: string;
  nom: string;
  prenom: string;
  filiere: string;
  statut: StatutDossier;
  montantPaye: number;
  numeroRecuCampost: string | null;
  motifRejet: string | null;
  centreDepot: {
    nom: string;
    ville: string;
    adresse: string;
    telephone: string;
  } | null;
  documents: { id: string; type: string; nomFichier: string }[];
  pdfsGeneres: { id: string; type: string; nomFichier: string }[];
}

// ─── Statut config (icons stay constant, labels come from i18n) ───────────────

const STATUT_META: Record<StatutDossier, {
  Icon: React.ElementType;
  badgeClass: string;
  bannerClass: string;
}> = {
  EN_ATTENTE: { Icon: Hourglass,   badgeClass: 'bg-muted text-muted-foreground',  bannerClass: 'from-muted to-muted/60 text-foreground' },
  SOUMIS:     { Icon: Hourglass,   badgeClass: 'bg-blue-100 text-blue-700',        bannerClass: 'from-blue-600 to-blue-400 text-white' },
  VALIDE:     { Icon: BadgeCheck,  badgeClass: 'bg-green-100 text-green-700',      bannerClass: 'from-green-600 to-green-400 text-white' },
  REJETE:     { Icon: XCircle,     badgeClass: 'bg-red-100 text-red-700',          bannerClass: 'from-destructive to-red-400 text-white' },
  ADMIS:      { Icon: CheckCircle, badgeClass: 'bg-purple-100 text-purple-700',    bannerClass: 'from-purple-600 to-purple-400 text-white' },
};

// ─── PDF helper ───────────────────────────────────────────────────────────────

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

export function CandidateDashboard() {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const [candidature, setCandidature] = useState<CandidatureMe | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  useEffect(() => {
    candidatureApi.me()
      .then(({ data }) => setCandidature(data.data as unknown as CandidatureMe))
      .catch((err) => {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setError('none');
        } else {
          setError(t('common.error'));
          toast.error(t('common.error'));
        }
      })
      .finally(() => setLoading(false));
  }, [t]);

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error === 'none') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <FileText className="w-16 h-16 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{t('dashboard.noApplication.title')}</h2>
          <p className="text-muted-foreground mb-6">{t('dashboard.noApplication.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/apply')}>{t('dashboard.noApplication.cta')}</Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>{t('common.retry')}</Button>
      </div>
    );
  }

  if (!candidature) return null;

  const statut = candidature.statut;
  const meta   = STATUT_META[statut];
  const StatusIcon = meta.Icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="src\img\cropped-logo-supptic.png" alt="logo" className="h-10" />
            <div>
              <h1 className="text-lg font-bold text-primary">{t('common.appName')}</h1>
              <p className="text-xs text-muted-foreground">{t('dashboard.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{candidature.prenom} {candidature.nom}</p>
              <p className="text-xs text-muted-foreground font-mono">{candidature.numeroCandidat}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

        {/* Bandeau statut */}
        <div className={`bg-gradient-to-r ${meta.bannerClass} rounded-xl p-6`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <StatusIcon className="w-7 h-7" />
            </div>
            <div>
              <Badge className={`mb-1 ${meta.badgeClass}`}>
                {t(`dashboard.statuts.${statut}.label`)}
              </Badge>
              <p className="text-sm opacity-90">
                {t(`dashboard.statuts.${statut}.description`)}
              </p>
            </div>
          </div>
        </div>

        {/* Motif de rejet */}
        {statut === 'REJETE' && candidature.motifRejet && (
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold text-sm mb-1">{t('dashboard.rejectReason')}</p>
              <p className="text-sm">{candidature.motifRejet}</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">

          {/* Infos candidature */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('dashboard.dossierInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.candidateNumber')}</span>
                <span className="font-mono font-bold text-primary">{candidature.numeroCandidat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.fullName')}</span>
                <span className="font-medium">{candidature.prenom} {candidature.nom}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">{t('dashboard.program')}</span>
                <span className="font-medium text-right max-w-[60%]">
                  {t(`filiere_labels.${candidature.filiere}`, { defaultValue: candidature.filiere })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('dashboard.feesPaid')}</span>
                <span className="font-medium text-green-600">
                  {candidature.montantPaye.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              {candidature.numeroRecuCampost && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('dashboard.campostReceipt')}</span>
                  <span className="font-mono">{candidature.numeroRecuCampost}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Centre de dépôt */}
          {candidature.centreDepot && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('dashboard.depositCenter')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-semibold">{candidature.centreDepot.nom}</p>
                <p className="text-muted-foreground">{candidature.centreDepot.adresse}</p>
                <p className="text-muted-foreground">{candidature.centreDepot.ville}</p>
                <p className="text-muted-foreground">{candidature.centreDepot.telephone}</p>
                {statut === 'SOUMIS' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>{t('dashboard.depositAction')}</strong>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('dashboard.submittedDocs')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {candidature.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('dashboard.noDocs')}</p>
              ) : (
                candidature.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                    <span className="text-muted-foreground">{doc.type.replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground truncate">— {doc.nomFichier}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Téléchargements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                {t('dashboard.downloads')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start gap-2"
                onClick={() => downloadBlob(
                  pdfApi.ficheCandidature(candidature.id),
                  `fiche-${candidature.numeroCandidat}.pdf`,
                  () => toast.error(t('dashboard.downloadError'))
                )}
              >
                <Download className="w-4 h-4" />
                {t('dashboard.downloadFiche')}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => downloadBlob(
                  pdfApi.recepisse(candidature.id),
                  `recepisse-${candidature.numeroCandidat}.pdf`,
                  () => toast.error(t('dashboard.downloadError'))
                )}
              >
                <Download className="w-4 h-4" />
                {t('dashboard.downloadRecepisse')}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
