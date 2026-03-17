import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Progress } from '../components/ui/progress';
import { GraduationCap, User, BookOpen, FileUp, CreditCard, ChevronLeft, ChevronRight, Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type Step = 1 | 2 | 3 | 4 | 5;

export function ApplicationFormPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    placeOfBirth: '',
    region: '',
    city: '',
    nationality: 'Cameroon',
    phone: '',
    email: '',
    // Academic Info
    diplomaType: '',
    baccalaureateSeries: '',
    yearObtained: '',
    schoolName: '',
    // Program
    program: '',
    // Documents
    documents: {
      birthCertificate: null as File | null,
      diploma: null as File | null,
      photo: null as File | null,
      nationalId: null as File | null,
    },
    // Payment
    paymentMethod: '',
  });

  const steps = [
    { number: 1, title: 'Personal Information', icon: User },
    { number: 2, title: 'Academic Information', icon: BookOpen },
    { number: 3, title: 'Program Selection', icon: GraduationCap },
    { number: 4, title: 'Document Upload', icon: FileUp },
    { number: 5, title: 'Payment', icon: CreditCard },
  ];

  const progress = (currentStep / 5) * 100;

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step);
    } else {
      // Submit application
      toast.success('Application submitted successfully!');
      navigate('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleFileUpload = (field: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [field]: file
      }
    }));
  };

  const regions = [
    'Adamawa', 'Centre', 'East', 'Far North', 'Littoral',
    'North', 'Northwest', 'South', 'Southwest', 'West'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary">SUPPTIC Application Form</h1>
              <p className="text-xs text-muted-foreground">Complete all steps to submit your application</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Step {currentStep} of 5</h2>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`flex flex-col items-center gap-2 ${
                currentStep >= step.number ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currentStep >= step.number
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <step.icon className="w-6 h-6" />
                )}
              </div>
              <span className="text-xs text-center font-medium hidden md:block">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card className="shadow-xl">
          <CardContent className="pt-8">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placeOfBirth">Place of Birth</Label>
                    <Input
                      id="placeOfBirth"
                      value={formData.placeOfBirth}
                      onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Academic Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">Academic Information</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="diplomaType">Diploma Type</Label>
                    <Select value={formData.diplomaType} onValueChange={(value) => setFormData({ ...formData, diplomaType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select diploma type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baccalaureate">Baccalauréat</SelectItem>
                        <SelectItem value="gce-al">GCE Advanced Level</SelectItem>
                        <SelectItem value="equivalent">Equivalent Diploma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baccalaureateSeries">Baccalauréat Series</Label>
                    <Select value={formData.baccalaureateSeries} onValueChange={(value) => setFormData({ ...formData, baccalaureateSeries: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select series" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="series-c">Series C (Mathematics & Physics)</SelectItem>
                        <SelectItem value="series-d">Series D (Mathematics & Natural Sciences)</SelectItem>
                        <SelectItem value="series-e">Series E (Mathematics & Technology)</SelectItem>
                        <SelectItem value="series-a">Series A (Literature)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearObtained">Year Obtained</Label>
                    <Input
                      id="yearObtained"
                      type="number"
                      min="2000"
                      max="2026"
                      value={formData.yearObtained}
                      onChange={(e) => setFormData({ ...formData, yearObtained: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      placeholder="Name of institution where diploma was obtained"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Program Selection */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">Choose Your Program</h3>
                <RadioGroup value={formData.program} onValueChange={(value) => setFormData({ ...formData, program: value })}>
                  <div className="space-y-4">
                    <div className="border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value="itt" id="itt" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="itt" className="text-lg font-bold cursor-pointer">
                            ITT – Ingénieurs des Travaux des Télécommunications
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Telecommunications Engineering (3 years) - Advanced training for telecommunications engineers
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value="ipt" id="ipt" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="ipt" className="text-lg font-bold cursor-pointer">
                            IPT – Inspecteurs des Postes et Télécommunications
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Postal and Telecommunications Inspection (3 years) - Professional inspector training
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value="tt" id="tt" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="tt" className="text-lg font-bold cursor-pointer">
                            TT – Techniciens des Télécommunications
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Telecommunications Technician (2 years) - Technical training for telecommunications systems
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-6 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-start gap-4">
                        <RadioGroupItem value="cpt" id="cpt" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="cpt" className="text-lg font-bold cursor-pointer">
                            CPT – Contrôleurs des Postes et Télécommunications
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Postal and Telecommunications Controller (2 years) - Operations management training
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Step 4: Document Upload */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">Upload Required Documents</h3>
                <div className="space-y-6">
                  {[
                    { id: 'birthCertificate', label: 'Birth Certificate', accept: '.pdf,.jpg,.png' },
                    { id: 'diploma', label: 'Baccalauréat Diploma', accept: '.pdf,.jpg,.png' },
                    { id: 'photo', label: 'Passport Photo (4x4)', accept: '.jpg,.png' },
                    { id: 'nationalId', label: 'National ID Card', accept: '.pdf,.jpg,.png' }
                  ].map((doc) => (
                    <div key={doc.id} className="border-2 border-dashed rounded-lg p-6 hover:border-primary transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Upload className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <Label className="text-base font-bold">{doc.label}</Label>
                            <p className="text-sm text-muted-foreground">
                              {formData.documents[doc.id as keyof typeof formData.documents]
                                ? (formData.documents[doc.id as keyof typeof formData.documents] as File).name
                                : 'PDF, JPG or PNG (Max 5MB)'}
                            </p>
                          </div>
                        </div>
                        <label htmlFor={doc.id}>
                          <Button type="button" variant="outline" onClick={() => document.getElementById(doc.id)?.click()}>
                            {formData.documents[doc.id as keyof typeof formData.documents] ? 'Change' : 'Upload'}
                          </Button>
                        </label>
                      </div>
                      <input
                        id={doc.id}
                        type="file"
                        accept={doc.accept}
                        className="hidden"
                        onChange={(e) => handleFileUpload(doc.id, e.target.files?.[0] || null)}
                      />
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Important:</strong> All documents must be clear and legible. Files should not exceed 5MB each.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Payment */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-6">Registration Payment</h3>
                <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-8 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-90">Registration Fee</p>
                      <p className="text-4xl font-bold mt-1">15,000 XAF</p>
                    </div>
                    <CreditCard className="w-16 h-16 opacity-50" />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-lg font-bold">Select Payment Method</Label>
                  <RadioGroup value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                    <div className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value="mtn" id="mtn" />
                        <div className="flex-1">
                          <Label htmlFor="mtn" className="cursor-pointer font-bold">MTN Mobile Money</Label>
                          <p className="text-sm text-muted-foreground">Pay securely with MTN MoMo</p>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value="orange" id="orange" />
                        <div className="flex-1">
                          <Label htmlFor="orange" className="cursor-pointer font-bold">Orange Money</Label>
                          <p className="text-sm text-muted-foreground">Pay securely with Orange Money</p>
                        </div>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <RadioGroupItem value="card" id="card" />
                        <div className="flex-1">
                          <Label htmlFor="card" className="cursor-pointer font-bold">Bank Card</Label>
                          <p className="text-sm text-muted-foreground">Visa, Mastercard accepted</p>
                        </div>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    <strong>Note:</strong> Your application will be processed only after payment confirmation. You will receive a receipt via email.
                  </p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleNext}>
                {currentStep === 5 ? (
                  <>
                    Submit Application
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
