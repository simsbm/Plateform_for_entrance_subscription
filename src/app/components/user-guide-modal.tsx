import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { HelpCircle, FileText, Upload, CreditCard, CheckCircle, Download } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

export function UserGuideModal() {
  const steps = [
    {
      icon: FileText,
      title: 'Create Your Account',
      description: 'Register with your personal information. Use a valid email address as all communications will be sent there.'
    },
    {
      icon: Upload,
      title: 'Complete Application Form',
      description: 'Fill in your personal and academic information accurately. Make sure all details match your official documents.'
    },
    {
      icon: Upload,
      title: 'Upload Documents',
      description: 'Upload clear copies of your birth certificate, diploma, passport photo, and national ID. All files should be under 5MB.'
    },
    {
      icon: CreditCard,
      title: 'Pay Registration Fee',
      description: 'Pay the 15,000 XAF registration fee using Mobile Money or bank card. Keep your payment receipt.'
    },
    {
      icon: Download,
      title: 'Download Application Slip',
      description: 'After payment confirmation, download your application slip. Bring it to the examination center.'
    },
    {
      icon: CheckCircle,
      title: 'Check Your Results',
      description: 'Results will be published on May 30, 2026. Use your candidate number to check your admission status.'
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="w-4 h-4 mr-2" />
          How It Works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Application Guide</DialogTitle>
          <DialogDescription>
            Follow these steps to complete your SUPPTIC entrance examination registration
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-muted-foreground">Step {index + 1}</span>
                  </div>
                  <h3 className="font-bold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-bold text-blue-900 mb-3">Important Information</h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Application deadline: March 31, 2026</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Examination date: April 15, 2026</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Results publication: May 30, 2026</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Registration fee: 15,000 XAF (non-refundable)</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h4 className="font-bold text-amber-900 mb-3">Need Help?</h4>
            <p className="text-sm text-amber-800 mb-3">
              If you encounter any issues during registration, our support team is here to help.
            </p>
            <div className="space-y-1 text-sm text-amber-900">
              <p><strong>Email:</strong> support@supptic.cm</p>
              <p><strong>Phone:</strong> +237 222 XX XX XX</p>
              <p><strong>Hours:</strong> Monday-Friday, 8AM-5PM</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
