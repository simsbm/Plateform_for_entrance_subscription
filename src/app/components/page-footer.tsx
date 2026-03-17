import { Link } from 'react-router';
import { GraduationCap, Mail, Phone, MapPin } from 'lucide-react';

export function PageFooter() {
  return (
    <footer className="bg-primary text-white py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg">SUPPTIC</h3>
            </div>
            <p className="text-sm text-blue-200">
              National Advanced School of Posts, Telecommunications and ICT
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="text-blue-200 hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/login" className="text-blue-200 hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/results" className="text-blue-200 hover:text-white transition-colors">Check Results</Link></li>
              <li><Link to="/" className="text-blue-200 hover:text-white transition-colors">Home</Link></li>
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
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-blue-200">
                <Mail className="w-4 h-4" />
                <span>info@supptic.cm</span>
              </li>
              <li className="flex items-center gap-2 text-blue-200">
                <Phone className="w-4 h-4" />
                <span>+237 222 XX XX XX</span>
              </li>
              <li className="flex items-center gap-2 text-blue-200">
                <MapPin className="w-4 h-4" />
                <span>Yaoundé, Cameroon</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/20 pt-8 text-center text-sm text-blue-200">
          <p>© 2026 SUPPTIC - National Advanced School of Posts, Telecommunications and ICT. All rights reserved.</p>
          <p className="mt-2 text-xs">Designed for educational and administrative excellence</p>
        </div>
      </div>
    </footer>
  );
}
