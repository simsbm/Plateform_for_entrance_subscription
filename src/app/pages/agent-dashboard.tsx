import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import {
  ClipboardList, CheckCircle2, XCircle, LogOut,
  AlertCircle, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { agentApi, clearAuth } from '../../lib/api';
import type { Dossier, StatsCentre, StatutDossier } from '../../lib/api';
import { LangSwitcher } from '../components/LangSwitcher';
import axios from 'axios';

type TabStatut = 'SOUMIS' | 'VALIDE' | 'REJETE';

function StatutBadge({ statut }: { statut: StatutDossier }) {
  const { t } = useTranslation();
  const map: Record<StatutDossier, string> = {
    EN_ATTENTE: 'bg-muted text-muted-foreground',
    SOUMIS:     'bg-blue-100 text-blue-700',
    VALIDE:     'bg-green-100 text-green-700',
    REJETE:     'bg-red-100 text-red-700',
    ADMIS:      'bg-purple-100 text-purple-700',
  };
  return (
    <Badge className={map[statut] ?? ''}>
      {t(`agent.statuts.${statut}`)}
    </Badge>
  );
}

export function AgentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [stats, setStats]         = useState<StatsCentre | null>(null);
  const [dossiers, setDossiers]   = useState<Dossier[]>([]);
  const [total, setTotal]         = useState(0);
  const [activeTab, setActiveTab] = useState<TabStatut>('SOUMIS');
  const [loading, setLoading]     = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [rejetId, setRejetId]           = useState<string | null>(null);
  const [motifRejet, setMotifRejet]     = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function loadStats() {
    agentApi.stats()
      .then(({ data }) => setStats(data.data))
      .catch(() => {});
  }

  useEffect(() => { loadStats(); }, []);

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
          ? err.response?.data?.message ?? t('common.error')
          : t('common.unexpectedError');
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [activeTab, refreshCounter, t]);

  function refresh() {
    setRefreshCounter((c) => c + 1);
    loadStats();
  }

  async function handleValider(id: string) {
    setActionLoading(id);
    try {
      await agentApi.valider(id, 'VALIDE');
      toast.success(t('agent.validateSuccess'));
      refresh();
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message : t('common.error'));
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejeter(id: string) {
    if (motifRejet.trim().length < 10) {
      toast.error(t('agent.rejectMotifError'));
      return;
    }
    setActionLoading(id);
    try {
      await agentApi.valider(id, 'REJETE', motifRejet.trim());
      toast.success(t('agent.rejectSuccess'));
      setRejetId(null);
      setMotifRejet('');
      refresh();
    } catch (err) {
      toast.error(axios.isAxiosError(err) ? err.response?.data?.message : t('common.error'));
    } finally {
      setActionLoading(null);
    }
  }

  const TABS: { value: TabStatut; tKey: string; Icon: React.ElementType }[] = [
    { value: 'SOUMIS', tKey: 'agent.tabs.toProcess', Icon: RefreshCw },
    { value: 'VALIDE', tKey: 'agent.tabs.validated',  Icon: CheckCircle2 },
    { value: 'REJETE', tKey: 'agent.tabs.rejected',   Icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-lg font-bold text-primary">{t('agent.title')}</h1>
              <p className="text-xs text-muted-foreground">{t('agent.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Button variant="outline" size="sm" onClick={() => { clearAuth(); navigate('/login'); }} className="gap-2">
              <LogOut className="w-4 h-4" />
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { key: 'enAttente', tKey: 'agent.stats.waiting',   color: 'text-muted-foreground' },
              { key: 'soumis',    tKey: 'agent.stats.toProcess', color: 'text-blue-600' },
              { key: 'valides',   tKey: 'agent.stats.validated', color: 'text-green-600' },
              { key: 'rejetes',   tKey: 'agent.stats.rejected',  color: 'text-destructive' },
            ] as { key: keyof StatsCentre; tKey: string; color: string }[]).map(({ key, tKey, color }) => (
              <Card key={key}>
                <CardContent className="pt-4 pb-4 text-center">
                  <p className={`text-3xl font-bold ${color}`}>{stats[key]}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t(tKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Table */}
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-base">
                {total} {t(total > 1 ? 'agent.results_plural' : 'agent.results')}
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                {TABS.map(({ value, tKey, Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setActiveTab(value); setRejetId(null); setMotifRejet(''); }}
                    className={[
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      activeTab === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    ].join(' ')}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t(tKey)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin" />
                {t('common.loading')}
              </div>
            ) : dossiers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                <AlertCircle className="w-8 h-8" />
                <p>{t('agent.empty')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('agent.table.candidateNum')}</TableHead>
                    <TableHead>{t('agent.table.candidate')}</TableHead>
                    <TableHead>{t('agent.table.program')}</TableHead>
                    <TableHead>{t('agent.table.campostReceipt')}</TableHead>
                    <TableHead>{t('agent.table.status')}</TableHead>
                    <TableHead className="text-right">{t('agent.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiers.map((d) => (
                    <>
                      <TableRow key={d.id}>
                        <TableCell className="font-mono text-xs">{d.numeroCandidat}</TableCell>
                        <TableCell className="font-medium">{d.nom} {d.prenom}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {t(`filiere_labels.${d.filiere}`, { defaultValue: d.filiere })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{d.numeroRecuCampost ?? '—'}</TableCell>
                        <TableCell><StatutBadge statut={d.statut} /></TableCell>
                        <TableCell className="text-right">
                          {d.statut === 'SOUMIS' && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm" className="bg-green-600 hover:bg-green-700"
                                disabled={actionLoading === d.id}
                                onClick={() => handleValider(d.id)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                {t('agent.validate')}
                              </Button>
                              <Button
                                size="sm" variant="destructive"
                                disabled={actionLoading === d.id}
                                onClick={() => setRejetId((prev) => (prev === d.id ? null : d.id))}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                {t('agent.reject')}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>

                      {rejetId === d.id && (
                        <TableRow key={`${d.id}-rejet`} className="bg-destructive/5">
                          <TableCell colSpan={6} className="py-4">
                            <div className="max-w-lg space-y-3">
                              <Label className="text-destructive font-semibold">
                                {t('agent.rejectMotifLabel')}
                              </Label>
                              <Textarea
                                placeholder={t('agent.rejectMotifPlaceholder')}
                                value={motifRejet}
                                onChange={(e) => setMotifRejet(e.target.value)}
                                rows={3}
                                className="border-destructive/50 focus-visible:ring-destructive"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm" variant="destructive"
                                  disabled={actionLoading === d.id}
                                  onClick={() => handleRejeter(d.id)}
                                >
                                  {t('agent.rejectConfirm')}
                                </Button>
                                <Button
                                  size="sm" variant="ghost"
                                  onClick={() => { setRejetId(null); setMotifRejet(''); }}
                                >
                                  {t('common.cancel')}
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
