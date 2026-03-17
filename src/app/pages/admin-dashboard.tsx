import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GraduationCap, Users, CheckCircle, Clock, DollarSign, Search, Filter, Download, LogOut, TrendingUp } from 'lucide-react';

export function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock statistics
  const stats = [
    { label: 'Total Candidates', value: '12,458', icon: Users, trend: '+12%', color: 'bg-primary' },
    { label: 'Completed Registrations', value: '10,234', icon: CheckCircle, trend: '+8%', color: 'bg-green-500' },
    { label: 'Payments Completed', value: '9,876', icon: DollarSign, trend: '+15%', color: 'bg-accent' },
    { label: 'Pending Applications', value: '2,224', icon: Clock, trend: '-5%', color: 'bg-yellow-500' },
  ];

  // Candidates by region
  const regionData = [
    { name: 'Centre', candidates: 3200 },
    { name: 'Littoral', candidates: 2800 },
    { name: 'West', candidates: 1900 },
    { name: 'Northwest', candidates: 1400 },
    { name: 'Southwest', candidates: 1300 },
    { name: 'Adamawa', candidates: 850 },
    { name: 'East', candidates: 600 },
    { name: 'North', candidates: 408 },
  ];

  // Candidates by program
  const programData = [
    { name: 'ITT', value: 4500, color: '#0A2A66' },
    { name: 'IPT', value: 3200, color: '#00AEEF' },
    { name: 'TT', value: 2800, color: '#FF7A00' },
    { name: 'CPT', value: 1958, color: '#10B981' },
  ];

  // Mock candidate data
  const candidates = [
    { id: '0001234', name: 'Jean Dupont', region: 'Centre', program: 'ITT', payment: 'completed', status: 'approved' },
    { id: '0001235', name: 'Marie Kamga', region: 'Littoral', program: 'IPT', payment: 'completed', status: 'approved' },
    { id: '0001236', name: 'Paul Nkengue', region: 'West', program: 'TT', payment: 'pending', status: 'pending' },
    { id: '0001237', name: 'Sophie Mbarga', region: 'Centre', program: 'CPT', payment: 'completed', status: 'approved' },
    { id: '0001238', name: 'David Talla', region: 'Northwest', program: 'ITT', payment: 'completed', status: 'approved' },
    { id: '0001239', name: 'Grace Ndi', region: 'Southwest', program: 'IPT', payment: 'pending', status: 'pending' },
    { id: '0001240', name: 'Emmanuel Fotso', region: 'West', program: 'TT', payment: 'completed', status: 'approved' },
    { id: '0001241', name: 'Ariane Njoh', region: 'Littoral', program: 'CPT', payment: 'completed', status: 'approved' },
  ];

  const filteredCandidates = candidates.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.includes(searchTerm);
    const matchesRegion = filterRegion === 'all' || c.region === filterRegion;
    const matchesProgram = filterProgram === 'all' || c.program === filterProgram;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesRegion && matchesProgram && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      approved: { className: 'bg-green-500', label: 'Approved' },
      pending: { className: 'bg-yellow-500', label: 'Pending' },
      rejected: { className: 'bg-red-500', label: 'Rejected' },
      completed: { className: 'bg-green-500', label: 'Completed' },
    };
    const statusConfig = config[status as keyof typeof config] || config.pending;
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white border-b">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-18 h-18 bg-white rounded-lg flex items-center justify-center">
                <img src="src\img\cropped-logo-supptic.png" alt="logo of supptic" />
              </div>
              <div>
                <h1 className="text-lg font-bold">SUPPTIC Admin Dashboard</h1>
                <p className="text-xs text-blue-100">Administrative Management Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">Administrator</p>
                <p className="text-xs text-blue-100">admin@supptic.cm</p>
              </div>
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/20">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>{stat.trend}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart - Candidates by Region */}
          <Card>
            <CardHeader>
              <CardTitle>Candidates by Region</CardTitle>
              <CardDescription>Distribution across all regions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="candidates" fill="#0A2A66" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Candidates by Program */}
          <Card>
            <CardHeader>
              <CardTitle>Candidates by Program</CardTitle>
              <CardDescription>Program selection distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={programData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {programData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Candidate Management Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Candidate Management</CardTitle>
                <CardDescription>Manage and filter all candidate applications</CardDescription>
              </div>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="Centre">Centre</SelectItem>
                  <SelectItem value="Littoral">Littoral</SelectItem>
                  <SelectItem value="West">West</SelectItem>
                  <SelectItem value="Northwest">Northwest</SelectItem>
                  <SelectItem value="Southwest">Southwest</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  <SelectItem value="ITT">ITT</SelectItem>
                  <SelectItem value="IPT">IPT</SelectItem>
                  <SelectItem value="TT">TT</SelectItem>
                  <SelectItem value="CPT">CPT</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell className="font-mono">SUPP-2026-{candidate.id}</TableCell>
                      <TableCell className="font-medium">{candidate.name}</TableCell>
                      <TableCell>{candidate.region}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{candidate.program}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(candidate.payment)}</TableCell>
                      <TableCell>{getStatusBadge(candidate.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
