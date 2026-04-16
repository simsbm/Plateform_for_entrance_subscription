import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  ClipboardList, CheckCircle2, XCircle, Clock, LogOut,
  PackageCheck, AlertCircle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { agentApi, clearAuth } from '../../lib/api';
import type { Dossier, StatsCentre, StatutDossier } from '../../lib/api';
import axios from 'axios';

// ─── Helpers d'affichage ──────────────────────────────────────────────────────

const FILIERE_LABELS: Record<string, string> = {
  ITT:     'ITT — Ingénieurs Télécom',
  IPT:     'IPT — Inspecteurs P&T',
  TT:      'TT — Techniciens Télécom',
  CPT:     'CPT — Contrôleurs P&T',
  ITT_ALT: 'ITT Alternance',
  IPT_ALT: 'IPT Alternance',
  IT:      'IT — Ingénieurs Télécom (Master)',
  APT:     'APT — Admins P&T (Master)',
};

type TabStatut = 'SOUMIS' | 'DEPOSE' | 'VALIDE' | 'REJETE';

const TABS: { value: TabStatut; label: string; icon: React.ElementType }[] = [
  { value: 'SOUMIS',  label: 'À confirmer',    icon: Clock },
  { value: 'DEPOSE',  label: 'À valider',       icon: PackageCheck },
  { value: 'VALIDE',  label: 'Validés',         icon: CheckCircle2 },
  { value: 'REJETE',  label: 'Rejetés',         icon: XCircle },
];

function StatutBadge({ statut }: { statut: StatutDossier }) {
  const map: Record<StatutDossier, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    EN_ATTENTE: { label: 'En attente',  variant: 'outline' },
    SOUMIS:     { label: 'Soumis',      variant: 'secondary' },
    DEPOSE:     { label: 'Déposé',      variant: 'default' },
    VALIDE:     { label: 'Validé',      variant: 'default' },
    REJETE:     { label: 'Rejeté',      variant: 'destructive' },
    ADMIS:      { label: 'Admis',       variant: 'default' },
  };
  const { label, variant } = map[statut] ?? { label: statut, variant: 'outline' };
  return (
    <Badge variant={variant} className={statut === 'VALIDE' ? 'bg-green-600' : undefined}>
      {label}
    </Badge>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function AgentDashboard() {
  const navigate = useNavigate();

  const [stats, setStats]         = useState<StatsCentre | null>(null);
  const [dossiers, setDossiers]   = useState<Dossier[]>([]);
  const [total, setTotal]         = useState(0);
  const [activeTab, setActiveTab] = useState<TabStatut>('SOUMIS');
  const [loading, setLoading]     = useState(false);

  // Rejet inline : id du dossier en cours de rejet + texte du motif
  const [rejetId, setRejetId]       = useState<string | null>(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Fetch stats ────────────────────────────────────────────────────────────
  useEffect(() => {
    agentApi.stats()
      .then(({ data }) => setStats(data.data))
      .catch(() => { /* stats non bloquantes */ });
  }, []);

  // ─── Fetch dossiers quand l'onglet change ────────────────────────────────────
  useEffect(() => {
    setDossiers([]);
    setLoading(true);
    agentApi.dossiers(activeTab)
      .then(({ data }) => {
        setDossiers(data.data.dossiers);
        setTotal(data.data.total);
      })
      .catch((err) => {
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.message ?? 'Erreur de chargement'
          : 'Erreur inattendue';
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  // ─── Actions ─────────────────────────────────────────────────────────────────

  async function handleConfirmerDepot(id: string) {
    setActionLoading(id);
    try {
      await agentApi.confirmerDepot(id);
      toast.success('Dépôt physique confirmé — dossier marqué DÉPOSÉ');
      refreshTab();
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleValider(id: string) {
    setActionLoading(id);
    try {
      await agentApi.valider(id, 'VALIDE');
      toast.success('Dossier validé avec succès');
      refreshTab();
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejeter(id: string) {
    if (motifRejet.trim().length < 10) {
      toast.error('Le motif doit faire au moins 10 caractères');
      return;
    }
    setActionLoading(id);
    try {
      await agentApi.valider(id, 'REJETE', motifRejet.trim());
      toast.success('Dossier rejeté');
      setRejetId(null);
      setMotifRejet('');
      refreshTab();
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message : 'Erreur');
    } finally {
      setActionLoading(null);
    }
  }

  function refreshTab() {
    // Re-déclenche le useEffect en forçant un changement de valeur
    setActiveTab((t) => t);
    // Workaround : incrément d'un refresh counter
    setRefreshCounter((c) => c + 1);
  }

  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    if (refreshCounter === 0) return;
    setLoading(true);
    agentApi.dossiers(activeTab)
      .then(({ data }) => {
        setDossiers(data.data.dossiers);
        setTotal(data.data.total);
        // Recharge aussi les stats
        agentApi.stats().then(({ data: s }) => setStats(s.data)).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCounter]);

  function handleLogout() {
    clearAuth();
    navigate('/login');
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-primary">Interface Agent</h1>
              <p className="text-xs text-muted-foreground">Gestion des dossiers physiques</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'En attente', value: stats.enAttente, color: 'text-muted-foreground' },
              { label: 'Soumis',     value: stats.soumis,    color: 'text-blue-600' },
              { label: 'Déposés',    value: stats.deposes,   color: 'text-orange-500' },
              { label: 'Validés',    value: stats.valides,   color: 'text-green-600' },
              { label: 'Rejetés',    value: stats.rejetes,   color: 'text-destructive' },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Onglets */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-base">
                Dossiers — {total} résultat{total > 1 ? 's' : ''}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                {TABS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setActiveTab(value); setRejetId(null); }}
                    className={[
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      activeTab === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    ].join(' ')}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Chargement…
              </div>
            ) : dossiers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <AlertCircle className="w-8 h-8" />
                <p>Aucun dossier dans cet onglet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° candidat</TableHead>
                    <TableHead>Candidat</TableHead>
                    <TableHead>Filière</TableHead>
                    <TableHead>N° reçu CAMPOST</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiers.map((d) => (
                    <>
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-xs">{d.numeroCandidat}</TableCell>
                        <TableCell className="font-medium">
                          {d.nom} {d.prenom}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {FILIERE_LABELS[d.filiere] ?? d.filiere}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {d.numeroRecuCampost ?? '—'}
                        </TableCell>
                        <TableCell>
                          <StatutBadge statut={d.statut} />
                        </TableCell>
                        <TableCell className="text-right">
                          {d.statut === 'SOUMIS' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading === d.id}
                              onClick={() => handleConfirmerDepot(d.id)}
                            >
                              <PackageCheck className="w-4 h-4 mr-1" />
                              Confirmer dépôt
                            </Button>
                          )}
                          {d.statut === 'DEPOSE' && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={actionLoading === d.id}
                                onClick={() => handleValider(d.id)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Valider
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={actionLoading === d.id}
                                onClick={() =>
                                  setRejetId((prev) => (prev === d.id ? null : d.id))
                                }
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Panneau de rejet inline */}
                      {rejetId === d.id && (
                        <TableRow key={`${d.id}-rejet`} className="bg-destructive/5">
                          <TableCell colSpan={6} className="py-4">
                            <div className="max-w-lg space-y-3">
                              <Label className="text-destructive font-semibold">
                                Motif de rejet (obligatoire, 10 caractères min.)
                              </Label>
                              <Textarea
                                placeholder="Ex : Document manquant, acte de naissance illisible…"
                                value={motifRejet}
                                onChange={(e) => setMotifRejet(e.target.value)}
                                rows={3}
                                className="border-destructive/50 focus-visible:ring-destructive"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={actionLoading === d.id}
                                  onClick={() => handleRejeter(d.id)}
                                >
                                  Confirmer le rejet
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => { setRejetId(null); setMotifRejet(''); }}
                                >
                                  Annuler
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
