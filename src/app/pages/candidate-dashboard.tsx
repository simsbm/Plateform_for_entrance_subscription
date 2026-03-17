import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { GraduationCap, Download, FileText, CheckCircle, Clock, AlertCircle, MapPin, Calendar, User, LogOut } from 'lucide-react';

export function CandidateDashboard() {
  const candidate = {
    name: 'ELI EYANGO',
    candidateNumber: 'SUPP-2026-0001234',
    email: 'eli.eyango@example.com',
    program: 'ITT – Telecommunications Engineering',
    applicationStatus: 'approved',
    documentStatus: 'verified',
    paymentStatus: 'completed',
    examCenter: 'Yaoundé - Centre Region',
    examDate: 'April 15, 2026',
    examTime: '08:00 AM',
  };

  const applicationSteps = [
    { label: 'Application Submitted', status: 'completed', date: 'March 1, 2026' },
    { label: 'Documents Verified', status: 'completed', date: 'March 5, 2026' },
    { label: 'Payment Confirmed', status: 'completed', date: 'March 6, 2026' },
    { label: 'Application Approved', status: 'completed', date: 'March 10, 2026' },
  ];

  const getStatusBadge = (status: string) => {
    const config = {
      approved: { variant: 'default' as const, className: 'bg-green-500', label: 'Approved' },
      pending: { variant: 'secondary' as const, className: 'bg-yellow-500', label: 'Pending' },
      rejected: { variant: 'destructive' as const, className: 'bg-red-500', label: 'Rejected' },
      verified: { variant: 'default' as const, className: 'bg-green-500', label: 'Verified' },
      completed: { variant: 'default' as const, className: 'bg-green-500', label: 'Completed' },
    };
    const statusConfig = config[status as keyof typeof config] || config.pending;
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-primary">SUPPTIC</h1>
                <p className="text-xs text-muted-foreground">Candidate Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{candidate.name}</p>
                <p className="text-xs text-muted-foreground">{candidate.candidateNumber}</p>
              </div>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {candidate.name}!</h2>
          <p className="text-blue-100">Your application has been successfully submitted and approved.</p>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Application Status</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">Approved</span>
                {getStatusBadge(candidate.applicationStatus)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Document Verification</CardTitle>
              <FileText className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">Verified</span>
                {getStatusBadge(candidate.documentStatus)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Payment Status</CardTitle>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">Completed</span>
                {getStatusBadge(candidate.paymentStatus)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Details */}
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
                <CardDescription>Your current application information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{candidate.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Candidate Number</p>
                      <p className="font-medium font-mono">{candidate.candidateNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Program</p>
                      <p className="font-medium">{candidate.program}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Exam Center</p>
                      <p className="font-medium">{candidate.examCenter}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exam Information */}
            <Card className="border-2 border-accent">
              <CardHeader className="bg-accent/10">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Exam Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Exam Date</p>
                    <p className="text-2xl font-bold text-accent">{candidate.examDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Time</p>
                    <p className="text-xl font-bold">{candidate.examTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Location</p>
                    <p className="font-medium">{candidate.examCenter}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-900 mb-1">Important Reminder</p>
                        <p className="text-sm text-amber-800">
                          Please arrive 30 minutes before the exam starts. Bring your ID card, application slip, and required stationery.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Application Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Application Timeline</CardTitle>
                <CardDescription>Track your application progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applicationSteps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        {index < applicationSteps.length - 1 && (
                          <div className="w-0.5 h-12 bg-green-500 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="font-medium">{step.label}</p>
                        <p className="text-sm text-muted-foreground">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Download Application Slip
                </Button>
                <Button className="w-full justify-start" variant="outline" size="lg">
                  <FileText className="w-5 h-5 mr-2" />
                  View Application Form
                </Button>
                <Button className="w-full justify-start" variant="outline" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Download Payment Receipt
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Contact our support team for assistance with your application.
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Email:</strong> support@supptic.cm</p>
                  <p><strong>Phone:</strong> +237 222 XX XX XX</p>
                  <p><strong>Hours:</strong> Mon-Fri, 8AM-5PM</p>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Important Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Deadline</p>
                    <p className="font-medium">July 31, 2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Exam Date</p>
                    <p className="font-medium">July 15, 2026</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Results Publication</p>
                    <p className="font-medium">July 30, 2026</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
