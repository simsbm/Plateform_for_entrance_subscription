import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap, Search, CheckCircle, XCircle, ArrowLeft, Trophy, Award, User, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

export function ResultCheckPage() {
  const [candidateNumber, setCandidateNumber] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckResult = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock result check
    setTimeout(() => {
      // Simulate different results based on input
      const isAdmitted = candidateNumber.endsWith('4') || candidateNumber.endsWith('5') || candidateNumber.endsWith('7');
      
      const mockResult = {
        candidateNumber: candidateNumber || 'SUPP-2026-0001234',
        name: 'AFAME MARINO',
        program: 'ITT – Telecommunications Engineering',
        examCenter: 'Yaoundé - Centre Region',
        status: isAdmitted ? 'admitted' : 'not-admitted',
        score: isAdmitted ? 85 : 45,
        rank: isAdmitted ? 42 : null,
        examDate: 'April 15, 2026'
      };

      setResult(mockResult);
      setIsLoading(false);

      // Trigger confetti for admitted candidates
      if (isAdmitted) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-10 h-10  rounded-lg flex items-center justify-center">
              <img src="src\img\cropped-logo-supptic.png" alt="logo of supptic" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">SUPPTIC</h1>
              <p className="text-xs text-muted-foreground">Check Examination Results</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {!result ? (
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-3xl">Check Your Results</CardTitle>
              <CardDescription>
                Enter your candidate number to view your examination results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckResult} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="candidateNumber">Candidate Number</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="candidateNumber"
                      placeholder="SUPP-2026-XXXXXXX"
                      value={candidateNumber}
                      onChange={(e) => setCandidateNumber(e.target.value)}
                      className="pl-10 text-lg"
                      required
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your candidate number is on your application slip
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Checking Results...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Check Results
                    </>
                  )}
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Demo:</strong> Try any candidate number ending with 4, 5, or 7 to see an "admitted" result. Other numbers will show "not admitted".
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Result Card */}
            {result.status === 'admitted' ? (
              <Card className="shadow-2xl border-4 border-green-500">
                <CardHeader className="text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-16 h-16 text-green-500" />
                  </div>
                  <CardTitle className="text-4xl mb-2">Congratulations! </CardTitle>
                  <CardDescription className="text-green-50 text-lg">
                    You have been admitted to SUPPTIC
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-green-700 mb-1">ADMITTED</div>
                      <div className="text-green-600">You have successfully passed the entrance examination</div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Candidate Name</span>
                        </div>
                        <div className="font-bold text-lg">{result.name}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <GraduationCap className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Candidate Number</span>
                        </div>
                        <div className="font-bold text-lg font-mono">{result.candidateNumber}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Program</span>
                        </div>
                        <div className="font-medium">{result.program}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Exam Date</span>
                        </div>
                        <div className="font-medium">{result.examDate}</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-primary to-secondary text-white rounded-lg p-6 text-center">
                        <div className="text-sm mb-1 opacity-90">Total Score</div>
                        <div className="text-5xl font-bold">{result.score}</div>
                        <div className="text-sm mt-1 opacity-90">out of 100</div>
                      </div>
                      <div className="bg-gradient-to-br from-accent to-yellow-500 text-white rounded-lg p-6 text-center">
                        <div className="text-sm mb-1 opacity-90">Rank</div>
                        <div className="text-5xl font-bold">#{result.rank}</div>
                        <div className="text-sm mt-1 opacity-90">nationwide</div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <h4 className="font-bold text-blue-900 mb-3">Next Steps</h4>
                      <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>You will receive an official admission letter via email within 5 business days</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>Registration for the new academic year will begin on June 1, 2026</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>Prepare required documents for enrollment as listed in the admission letter</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex gap-4">
                      <Button className="flex-1" size="lg">
                        Download Result Certificate
                      </Button>
                      <Button variant="outline" className="flex-1" size="lg">
                        Print Results
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-2xl border-4 border-gray-300">
                <CardHeader className="text-center bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-t-lg">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-16 h-16 text-gray-500" />
                  </div>
                  <CardTitle className="text-4xl mb-2">Examination Results</CardTitle>
                  <CardDescription className="text-gray-100 text-lg">
                    Thank you for your participation
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
                      <XCircle className="w-16 h-16 text-gray-500 mx-auto mb-3" />
                      <div className="text-3xl font-bold text-gray-700 mb-1">NOT ADMITTED</div>
                      <div className="text-gray-600">Unfortunately, you did not meet the admission requirements</div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Candidate Name</span>
                        </div>
                        <div className="font-bold text-lg">{result.name}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <GraduationCap className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Candidate Number</span>
                        </div>
                        <div className="font-bold text-lg font-mono">{result.candidateNumber}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Award className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Program</span>
                        </div>
                        <div className="font-medium">{result.program}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Exam Date</span>
                        </div>
                        <div className="font-medium">{result.examDate}</div>
                      </div>
                    </div>

                    <div className="bg-gray-100 rounded-lg p-6 text-center">
                      <div className="text-sm text-muted-foreground mb-1">Total Score</div>
                      <div className="text-5xl font-bold text-gray-700">{result.score}</div>
                      <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                      <h4 className="font-bold text-amber-900 mb-3">What's Next?</h4>
                      <ul className="space-y-2 text-sm text-amber-800">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>You may apply again for the next examination session</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>Consider reviewing study materials and preparation resources</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>Contact our academic counseling service for guidance</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setResult(null);
                  setCandidateNumber('');
                }}
              >
                Check Another Result
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
