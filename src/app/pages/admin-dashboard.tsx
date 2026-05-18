import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Users, CheckCircle, Clock, DollarSign, Search, Download, LogOut,
  TrendingUp, XCircle, RefreshCw, UserCheck, Eye, Phone, Mail, MapPin,
  Building2, LayoutDashboard, BarChart2, FileText,
} from 'lucide-react';
import { adminApi, AdminStats, AdminCandidature, AdminCandidatureDetail, getToken, clearAuth } from '../../lib/api';

const FILIERE_COLORS: Record<string, string> = {
  ITT: '#0A2A66', IPT: '#00AEEF', TT: '#FF7A00', CPT: '#10B981',
  ITT_ALT: '#6366F1', IPT_ALT: '#EC4899', IT: '#F59E0B', APT: '#14B8A6',
};

const STATUT_LABELS: Record<string, string> = {
  EN_ATTENTE: 'En attente', SOUMIS: 'Soumis', VALIDE: 'Validé', REJETE: 'Rejeté', ADMIS: 'Admis',
};

const STATUT_COLORS: Record<string, string> = {
  EN_ATTENTE: 'bg-gray-400', SOUMIS: 'bg-blue-500',
  VALIDE: 'bg-green-500',    REJETE: 'bg-red-500', ADMIS: 'bg-purple-500',
};

type Section = 'apercu' | 'statistiques' | 'candidatures' | 'exports';

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'apercu',        label: 'Aperçu',        icon: LayoutDashboard, description: 'Vue générale' },
  { id: 'statistiques',  label: 'Statistiques',  icon: BarChart2,       description: 'Graphiques & tendances' },
  { id: 'candidatures',  label: 'Candidatures',  icon: Users,           description: 'Gestion des dossiers' },
  { id: 'exports',       label: 'Exports',       icon: FileText,        description: 'Télécharger les listes' },
];

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<Section>('apercu');

  const [stats, setStats]               = useState<AdminStats | null>(null);
  const [candidatures, setCandidatures] = useState<AdminCandidature[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [lastRefresh, setLastRefresh]   = useState(new Date());
  const [evolution, setEvolution]       = useState<{ date: string; count: number }[]>([]);
  const [selectedCandidat, setSelectedCandidat] = useState<AdminCandidatureDetail | null>(null);
  const [detailLoading, setDetailLoading]       = useState(false);
  const [updatingStatut, setUpdatingStatut]     = useState(false);

  const [search,  setSearch]  = useState('');
  const [region,  setRegion]  = useState('all');
  const [filiere, setFiliere] = useState('all');
  const [statut,  setStatut]  = useState('all');

  const LIMIT = 15;

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await adminApi.stats();
      setStats(data.data);
      setLastRefresh(new Date());
    } catch { /* silencieux */ } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchEvolution = useCallback(async () => {
    try {
      const { data } = await adminApi.evolution(30);
      setEvolution(data.data);
    } catch { /* silencieux */ }
  }, []);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setSelectedCandidat(null);
    try {
      const { data } = await adminApi.candidatureDetail(id);
      setSelectedCandidat(data.data);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatutChange = async (newStatut: string) => {
    if (!selectedCandidat) return;
    setUpdatingStatut(true);
    try {
      await adminApi.updateStatut(selectedCandidat.id, newStatut);
      setSelectedCandidat(prev => prev ? { ...prev, statut: newStatut } : prev);
      setCandidatures(prev => prev.map(c => c.id === selectedCandidat.id ? { ...c, statut: newStatut } : c));
      fetchStats();
    } finally {
      setUpdatingStatut(false);
    }
  };

  const fetchCandidatures = useCallback(async () => {
    setTableLoading(true);
    try {
      const { data } = await adminApi.candidatures({
        page, limit: LIMIT,
        search:  search  || undefined,
        region:  region  !== 'all' ? region  : undefined,
        filiere: filiere !== 'all' ? filiere : undefined,
        statut:  statut  !== 'all' ? statut  : undefined,
      });
      setCandidatures(data.data.candidatures);
      setTotal(data.data.total);
    } catch { /* silencieux */ } finally {
      setTableLoading(false);
    }
  }, [page, search, region, filiere, statut]);

  useEffect(() => { fetchStats(); },        [fetchStats]);
  useEffect(() => { fetchEvolution(); },    [fetchEvolution]);
  useEffect(() => { fetchCandidatures(); }, [fetchCandidatures]);
  useEffect(() => {
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);
  useEffect(() => { setPage(1); }, [search, region, filiere, statut]);

  const downloadCsv = (url: string, filename: string) => {
    const token = getToken();
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
      });
  };

  const handleExport = () => {
    const url = adminApi.exportUrl({
      region:  region  !== 'all' ? region  : undefined,
      filiere: filiere !== 'all' ? filiere : undefined,
      statut:  statut  !== 'all' ? statut  : undefined,
    });
    const suffix = filiere !== 'all' ? `-${filiere}` : '';
    downloadCsv(url, `candidats-supptic${suffix}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportFiliere = (f?: string) => {
    const url = adminApi.exportUrl({ filiere: f });
    const suffix = f ? `-${f}` : '';
    downloadCsv(url, `candidats-supptic${suffix}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ── Header ── */}
      <header className="bg-gradient-to-r from-primary to-secondary text-white shadow-md z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
              <img src="/src/img/cropped-logo-supptic.png" alt="logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">Tableau de bord Admin — SUP'PTIC</h1>
              <p className="text-xs text-blue-100 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block opacity-80">admin@supptic.cm</span>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => clearAuth()}>
                <LogOut className="w-4 h-4 mr-1" /> Déconnexion
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Corps : sidebar + contenu ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 bg-white border-r shadow-sm flex flex-col">
          <nav className="flex-1 py-4 space-y-1 px-3">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    active
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium leading-tight">{item.label}</p>
                    <p className={`text-xs leading-tight ${active ? 'text-blue-100' : 'text-gray-400'}`}>
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Résumé rapide dans la sidebar */}
          {stats && (
            <div className="p-3 border-t bg-gray-50 space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase">Résumé</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-primary">{stats.total}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Soumis</span>
                <span className="font-bold text-blue-500">{stats.parStatut.SOUMIS}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Validés</span>
                <span className="font-bold text-green-500">{stats.parStatut.VALIDE}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Admis</span>
                <span className="font-bold text-purple-500">{stats.parStatut.ADMIS}</span>
              </div>
            </div>
          )}
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 overflow-y-auto p-6">

          {/* ── APERÇU ── */}
          {activeSection === 'apercu' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Aperçu général</h2>
                <p className="text-sm text-gray-500">Statistiques clés de la plateforme</p>
              </div>

              {/* Cartes principales */}
              {statsLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>
                  ))}
                </div>
              ) : stats && (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Total candidats',  value: stats.total,                   icon: Users,      color: 'bg-primary',    sub: 'inscrits sur la plateforme' },
                      { label: 'Dossiers soumis',  value: stats.parStatut.SOUMIS,         icon: CheckCircle, color: 'bg-blue-500',  sub: 'en attente de dépôt physique' },
                      { label: 'Dossiers validés', value: stats.parStatut.VALIDE,         icon: UserCheck,  color: 'bg-green-500',  sub: 'acceptés par un agent' },
                      { label: 'Montant collecté', value: `${stats.montantTotal.toLocaleString('fr-FR')} FCFA`, icon: DollarSign, color: 'bg-accent', sub: 'total des frais reçus' },
                    ].map((stat, i) => (
                      <Card key={i} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                          <div className={`w-9 h-9 ${stat.color} rounded-lg flex items-center justify-center`}>
                            <stat.icon className="w-4 h-4 text-white" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{stat.value}</div>
                          <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Cartes secondaires */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'En attente',          value: stats.parStatut.EN_ATTENTE, icon: Clock,     color: 'text-gray-500' },
                      { label: 'Rejetés',             value: stats.parStatut.REJETE,     icon: XCircle,   color: 'text-red-500' },
                      { label: 'Admis',               value: stats.parStatut.ADMIS,      icon: TrendingUp, color: 'text-purple-500' },
                      { label: 'En attente + Soumis', value: stats.parStatut.EN_ATTENTE + stats.parStatut.SOUMIS, icon: Clock, color: 'text-yellow-500' },
                    ].map((s, i) => (
                      <Card key={i}>
                        <CardContent className="pt-4 flex items-center gap-3">
                          <s.icon className={`w-5 h-5 ${s.color}`} />
                          <div>
                            <p className="text-xl font-bold">{s.value}</p>
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Dernières inscriptions */}
              {stats && stats.derniersInscrits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dernières inscriptions</CardTitle>
                    <CardDescription>Les 5 candidats inscrits le plus récemment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.derniersInscrits.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                              {c.prenom[0]}{c.nom[0]}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{c.prenom} {c.nom}</p>
                              <p className="text-xs text-muted-foreground">{c.numeroCandidat} · {c.region}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{c.filiere}</Badge>
                            <Badge className={`${STATUT_COLORS[c.statut]} text-white text-xs`}>
                              {STATUT_LABELS[c.statut]}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── STATISTIQUES ── */}
          {activeSection === 'statistiques' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Statistiques</h2>
                <p className="text-sm text-gray-500">Graphiques et tendances des inscriptions</p>
              </div>

              {stats && (
                <>
                  <div className="grid lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Candidats par région</CardTitle>
                        <CardDescription>Répartition géographique en temps réel</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={stats.parRegion}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="region" angle={-30} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip formatter={(v) => [v, 'Candidats']} />
                            <Bar dataKey="count" fill="#0A2A66" name="Candidats" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Candidats par filière</CardTitle>
                        <CardDescription>Répartition des inscriptions par programme</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={stats.parFiliere}
                              dataKey="count"
                              nameKey="filiere"
                              cx="50%" cy="50%"
                              outerRadius={100}
                              label={({ filiere: f, percent }) => `${f}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {stats.parFiliere.map((entry, i) => (
                                <Cell key={i} fill={FILIERE_COLORS[entry.filiere] ?? '#8884d8'} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v, n) => [v, n]} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {evolution.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Évolution des inscriptions</CardTitle>
                        <CardDescription>Nombre d'inscriptions par jour sur les 30 derniers jours</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={evolution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                            <YAxis allowDecimals={false} />
                            <Tooltip labelFormatter={d => `Date : ${d}`} formatter={(v) => [v, 'Inscriptions']} />
                            <Line type="monotone" dataKey="count" stroke="#0A2A66" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Inscriptions" />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── CANDIDATURES ── */}
          {activeSection === 'candidatures' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Candidatures</h2>
                  <p className="text-sm text-gray-500">{total} candidat{total > 1 ? 's' : ''} — page {page} / {totalPages || 1}</p>
                </div>
                <Button onClick={handleExport} variant="outline">
                  <Download className="w-4 h-4 mr-2" /> Exporter CSV
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  {/* Filtres */}
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Nom, prénom, numéro..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={region} onValueChange={setRegion}>
                      <SelectTrigger><SelectValue placeholder="Région" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les régions</SelectItem>
                        {['Adamaoua','Centre','Est','Extrême-Nord','Littoral','Nord','Nord-Ouest','Ouest','Sud','Sud-Ouest'].map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filiere} onValueChange={setFiliere}>
                      <SelectTrigger><SelectValue placeholder="Filière" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les filières</SelectItem>
                        {['ITT','IPT','TT','CPT','ITT_ALT','IPT_ALT','IT','APT'].map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={statut} onValueChange={setStatut}>
                      <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        {Object.entries(STATUT_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tableau */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Numéro</TableHead>
                          <TableHead>Nom complet</TableHead>
                          <TableHead>Région</TableHead>
                          <TableHead>Filière</TableHead>
                          <TableHead>Centre</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tableLoading ? (
                          [...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                              {[...Array(9)].map((_, j) => (
                                <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : candidatures.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                              Aucun candidat trouvé
                            </TableCell>
                          </TableRow>
                        ) : candidatures.map(c => (
                          <TableRow key={c.id} className="hover:bg-muted/40">
                            <TableCell className="font-mono text-xs">{c.numeroCandidat}</TableCell>
                            <TableCell className="font-medium">{c.prenom} {c.nom}</TableCell>
                            <TableCell className="text-sm">{c.region}</TableCell>
                            <TableCell><Badge variant="outline">{c.filiere}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {c.centreDepot ? c.centreDepot.ville : '—'}
                            </TableCell>
                            <TableCell className="text-sm">{c.montantPaye.toLocaleString('fr-FR')} F</TableCell>
                            <TableCell>
                              <Badge className={`${STATUT_COLORS[c.statut]} text-white text-xs`}>
                                {STATUT_LABELS[c.statut]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(c.createdAt).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => openDetail(c.id)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} sur {total} candidats
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                          Précédent
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── EXPORTS ── */}
          {activeSection === 'exports' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Exports</h2>
                <p className="text-sm text-gray-500">Télécharger les listes de candidats au format CSV</p>
              </div>

              {/* Export tout */}
              <Card>
                <CardHeader>
                  <CardTitle>Export complet</CardTitle>
                  <CardDescription>Télécharger la liste de tous les candidats</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => handleExportFiliere()} className="w-full md:w-auto">
                    <Download className="w-4 h-4 mr-2" /> Exporter tous les candidats
                  </Button>
                </CardContent>
              </Card>

              {/* Export par filière */}
              {stats && stats.parFiliere.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Export par filière</CardTitle>
                    <CardDescription>Télécharger la liste CSV de chaque filière séparément</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {stats.parFiliere.map(({ filiere: f, count }) => (
                        <button
                          key={f}
                          onClick={() => handleExportFiliere(f)}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/60 hover:border-primary/40 transition-all text-left group"
                        >
                          <div>
                            <p className="font-semibold">{f}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{count} candidat{count > 1 ? 's' : ''}</p>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Export par statut */}
              <Card>
                <CardHeader>
                  <CardTitle>Export par statut</CardTitle>
                  <CardDescription>Télécharger uniquement les candidats d'un statut précis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(STATUT_LABELS).map(([key, label]) => {
                      const count = stats?.parStatut[key as keyof typeof stats.parStatut] ?? 0;
                      return (
                        <button
                          key={key}
                          onClick={() => downloadCsv(
                            adminApi.exportUrl({ statut: key }),
                            `candidats-supptic-${key.toLowerCase()}-${new Date().toISOString().slice(0,10)}.csv`
                          )}
                          className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/60 hover:border-primary/40 transition-all text-left group"
                        >
                          <div>
                            <p className="font-semibold">{label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{count} candidat{count > 1 ? 's' : ''}</p>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </main>
      </div>
    </div>

    {/* Modal détail candidat */}
    <Dialog open={!!selectedCandidat || detailLoading} onOpenChange={(open) => { if (!open) setSelectedCandidat(null); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {detailLoading ? 'Chargement...' : selectedCandidat ? `${selectedCandidat.prenom} ${selectedCandidat.nom}` : ''}
          </DialogTitle>
        </DialogHeader>

        {detailLoading && (
          <div className="space-y-3 animate-pulse">
            {[...Array(6)].map((_, i) => <div key={i} className="h-8 bg-muted rounded" />)}
          </div>
        )}

        {selectedCandidat && !detailLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-muted-foreground" />{selectedCandidat.email}</div>
              <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" />{selectedCandidat.telephone}</div>
              <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-muted-foreground" />{selectedCandidat.region}</div>
              <div className="flex items-center gap-2 text-sm"><Building2 className="w-4 h-4 text-muted-foreground" />
                {selectedCandidat.centreDepot ? `${selectedCandidat.centreDepot.nom} — ${selectedCandidat.centreDepot.ville}` : '—'}
              </div>
            </div>
            <hr />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Diplôme</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Type :</span> {selectedCandidat.typeDiplome ?? '—'}</div>
                <div><span className="text-muted-foreground">Année :</span> {selectedCandidat.anneeObtention ?? '—'}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Établissement :</span> {selectedCandidat.etablissement ?? '—'}</div>
                <div><span className="text-muted-foreground">Langue :</span> {selectedCandidat.langueComposition ?? '—'}</div>
              </div>
            </div>
            <hr />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Candidature</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Numéro :</span> <span className="font-mono">{selectedCandidat.numeroCandidat}</span></div>
                <div><span className="text-muted-foreground">Filière :</span> <Badge variant="outline">{selectedCandidat.filiere}</Badge></div>
                <div><span className="text-muted-foreground">Montant :</span> {selectedCandidat.montantPaye.toLocaleString('fr-FR')} FCFA</div>
                <div><span className="text-muted-foreground">N° reçu :</span> {selectedCandidat.numeroRecuCampost ?? '—'}</div>
              </div>
            </div>
            <hr />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Statut du dossier</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUT_LABELS).map(([key, label]) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={selectedCandidat.statut === key ? 'default' : 'outline'}
                    disabled={updatingStatut}
                    onClick={() => handleStatutChange(key)}
                    className={selectedCandidat.statut === key ? `${STATUT_COLORS[key]} text-white border-0` : ''}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            {selectedCandidat.documents.length > 0 && (
              <>
                <hr />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Documents joints ({selectedCandidat.documents.length})</p>
                  <div className="space-y-1">
                    {selectedCandidat.documents.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm p-2 bg-muted/40 rounded">
                        <span className="font-medium">{doc.type}</span>
                        <span className="text-muted-foreground text-xs">— {doc.nomFichier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
