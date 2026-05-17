import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, CheckCircle, Clock, DollarSign, Search, Download, LogOut, TrendingUp, XCircle, RefreshCw, UserCheck } from 'lucide-react';
import { adminApi, AdminStats, AdminCandidature, getToken, clearAuth } from '../../lib/api';

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

export function AdminDashboard() {
  const [stats, setStats]               = useState<AdminStats | null>(null);
  const [candidatures, setCandidatures] = useState<AdminCandidature[]>([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [lastRefresh, setLastRefresh]   = useState(new Date());

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
    } catch {
      // silencieux
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchCandidatures = useCallback(async () => {
    setTableLoading(true);
    try {
      const { data } = await adminApi.candidatures({
        page,
        limit: LIMIT,
        search:  search  || undefined,
        region:  region  !== 'all' ? region  : undefined,
        filiere: filiere !== 'all' ? filiere : undefined,
        statut:  statut  !== 'all' ? statut  : undefined,
      });
      setCandidatures(data.data.candidatures);
      setTotal(data.data.total);
    } catch {
      // silencieux
    } finally {
      setTableLoading(false);
    }
  }, [page, search, region, filiere, statut]);

  // Chargement initial
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchCandidatures(); }, [fetchCandidatures]);

  // Auto-refresh stats toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Reset page quand les filtres changent
  useEffect(() => { setPage(1); }, [search, region, filiere, statut]);

  const handleExport = () => {
    const token = getToken();
    const url = adminApi.exportUrl({
      region:  region  !== 'all' ? region  : undefined,
      filiere: filiere !== 'all' ? filiere : undefined,
      statut:  statut  !== 'all' ? statut  : undefined,
    });
    // Téléchargement avec le token JWT
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `candidats-supptic-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
      });
  };

  const handleLogout = () => { clearAuth(); };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white border-b">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <img src="/src/img/cropped-logo-supptic.png" alt="logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Tableau de bord Admin — SUP'PTIC</h1>
                <p className="text-xs text-blue-100 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm hidden md:block">admin@supptic.cm</p>
              <Link to="/login">
                <Button variant="ghost" className="text-white hover:bg-white/20" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">

        {/* Cartes statistiques */}
        {statsLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>
            ))}
          </div>
        ) : stats && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total candidats', value: stats.total, icon: Users, color: 'bg-primary', sub: 'inscrits sur la plateforme' },
              { label: 'Dossiers soumis', value: stats.parStatut.SOUMIS, icon: CheckCircle, color: 'bg-blue-500', sub: 'en attente de dépôt physique' },
              { label: 'Dossiers validés', value: stats.parStatut.VALIDE, icon: UserCheck, color: 'bg-green-500', sub: 'acceptés par un agent' },
              { label: 'Montant collecté', value: `${stats.montantTotal.toLocaleString('fr-FR')} FCFA`, icon: DollarSign, color: 'bg-accent', sub: 'total des frais reçus' },
            ].map((stat, i) => (
              <Card key={i} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statuts secondaires */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'En attente', value: stats.parStatut.EN_ATTENTE, icon: Clock, color: 'text-gray-500' },
              { label: 'Rejetés',    value: stats.parStatut.REJETE,     icon: XCircle, color: 'text-red-500' },
              { label: 'Admis',      value: stats.parStatut.ADMIS,      icon: TrendingUp, color: 'text-purple-500' },
              { label: 'En attente + Soumis', value: stats.parStatut.EN_ATTENTE + stats.parStatut.SOUMIS, icon: Clock, color: 'text-yellow-500' },
            ].map((s, i) => (
              <Card key={i}>
                <CardContent className="pt-4 flex items-center gap-3">
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Graphiques */}
        {stats && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Bar chart — par région */}
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

            {/* Pie chart — par filière */}
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
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ filiere, percent }) => `${filiere}: ${(percent * 100).toFixed(0)}%`}
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
        )}

        {/* Derniers inscrits */}
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

        {/* Tableau des candidatures */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestion des candidatures</CardTitle>
                <CardDescription>
                  {total} candidat{total > 1 ? 's' : ''} — page {page} / {totalPages || 1}
                </CardDescription>
              </div>
              <Button onClick={handleExport} variant="outline">
                <Download className="w-4 h-4 mr-2" /> Exporter CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        {[...Array(8)].map((_, j) => (
                          <TableCell key={j}><div className="h-4 bg-muted animate-pulse rounded" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : candidatures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucun candidat trouvé
                      </TableCell>
                    </TableRow>
                  ) : candidatures.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-xs">{c.numeroCandidat}</TableCell>
                      <TableCell className="font-medium">{c.prenom} {c.nom}</TableCell>
                      <TableCell className="text-sm">{c.region}</TableCell>
                      <TableCell><Badge variant="outline">{c.filiere}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.centreDepot ? `${c.centreDepot.ville}` : '—'}
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
    </div>
  );
}
