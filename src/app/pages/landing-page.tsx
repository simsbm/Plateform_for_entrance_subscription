import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap, FileText, Upload, CreditCard, Download, CheckCircle, ArrowRight, Users, Award, Globe } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { UserGuideModal } from '../components/user-guide-modal';

export function LandingPage() {
  const programs = [
    {
      id: 'itt',
      title: 'ITT – Telecommunications Engineering',
      description: 'Advanced training program for telecommunications engineers. Develop expertise in network infrastructure, systems design, and cutting-edge technologies.',
      duration: '3 years',
      level: 'Engineering Degree'
    },
    {
      id: 'ipt',
      title: 'IPT – Postal and Telecommunications Inspection',
      description: 'Professional program for postal and telecommunications inspectors. Master regulatory frameworks, quality assurance, and service management.',
      duration: '3 years',
      level: 'Professional Degree'
    },
    {
      id: 'tt',
      title: 'TT – Telecommunications Technician',
      description: 'Technical training for telecommunications technicians. Learn installation, maintenance, and troubleshooting of telecom systems and equipment.',
      duration: '2 years',
      level: 'Technical Certificate'
    },
    {
      id: 'cpt',
      title: 'CPT – Postal and Telecommunications Controller',
      description: 'Specialized program for postal and telecommunications controllers. Focus on operations management, logistics, and customer service excellence.',
      duration: '2 years',
      level: 'Professional Certificate'
    }
  ];

  const processSteps = [
    { number: 1, title: 'Create Account', description: 'Register with your email and personal information', icon: Users },
    { number: 2, title: 'Complete Application', description: 'Fill in the online application form', icon: FileText },
    { number: 3, title: 'Upload Documents', description: 'Submit required documents securely', icon: Upload },
    { number: 4, title: 'Pay Registration Fee', description: 'Complete payment via mobile money or bank card', icon: CreditCard },
    { number: 5, title: 'Download Slip', description: 'Get your application confirmation receipt', icon: Download }
  ];

  const stats = [
    { value: '10,000+', label: 'Candidates Registered', icon: Users },
    { value: '4', label: 'Training Programs', icon: GraduationCap },
    { value: '95%', label: 'Success Rate', icon: Award },
    { value: '10', label: 'Regional Centers', icon: Globe }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-18 h-18  rounded-lg flex items-center justify-center">
                <img src="src\img\cropped-logo-supptic.png" alt="logo of supptic" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">SUPPTIC</h1>
                <p className="text-xs text-muted-foreground">National Advanced School</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <UserGuideModal />
              <Link to="/results">
                <Button variant="ghost">Check Results</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Register Now</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary to-secondary text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Official Government Platform</span>
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Official SUPPTIC Entrance Examination Registration Platform
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Register online for the national entrance examination. Secure, fast, and accessible from anywhere.
              </p>
              <div className="flex gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
                    Register Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="src\img\IMG_4052.jpg"
                  alt="Students studying telecommunications"
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">Available Programs</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from our comprehensive training programs designed to prepare future leaders in telecommunications and postal services.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {programs.map((program) => (
              <Card key={program.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-2xl">{program.title}</CardTitle>
                    <div className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium">
                      {program.level}
                    </div>
                  </div>
                  <CardDescription className="text-base">{program.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      <span>{program.duration}</span>
                    </div>
                    <Link to="/register">
                      <Button>Apply Now</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">Application Process</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Follow these simple steps to complete your registration
            </p>
          </div>
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent -translate-y-1/2" style={{ zIndex: 0 }} />
            
            <div className="grid md:grid-cols-5 gap-8 relative" style={{ zIndex: 1 }}>
              {processSteps.map((step, index) => (
                <div key={step.number} className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 bg-white border-4 border-primary rounded-full flex items-center justify-center shadow-lg">
                      <step.icon className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-bold shadow">
                      {step.number}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of candidates preparing for a career in telecommunications and postal services.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                Create Your Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Already Registered? Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">SUPPTIC</h3>
              <p className="text-sm text-blue-200">
                National Advanced School of Posts, Telecommunications and ICT
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="text-blue-200 hover:text-white">Register</Link></li>
                <li><Link to="/login" className="text-blue-200 hover:text-white">Login</Link></li>
                <li><Link to="/results" className="text-blue-200 hover:text-white">Check Results</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Programs</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li>ITT – Engineering</li>
                <li>IPT – Inspection</li>
                <li>TT – Technician</li>
                <li>CPT – Controller</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li>Email: info@supptic.cm</li>
                <li>Phone: +237 222 XX XX XX</li>
                <li>Yaoundé, Cameroon</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm text-blue-200">
            <p>© 2026 SUPPTIC - National Advanced School of Posts, Telecommunications and ICT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}