import { Link } from 'react-router';
import { Button } from './ui/button';
import { GraduationCap } from 'lucide-react';

interface PageHeaderProps {
  showAuthButtons?: boolean;
  currentUser?: {
    name: string;
    role: 'candidate' | 'admin';
  };
}

export function PageHeader({ showAuthButtons = true, currentUser }: PageHeaderProps) {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            
            <div>
              <h1 className="text-xl font-bold text-primary">SUPPTIC</h1>
              <p className="text-xs text-muted-foreground">National Advanced School</p>
            </div>
          </Link>
          
          {showAuthButtons && !currentUser && (
            <div className="flex items-center gap-4">
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
          )}
          
          {currentUser && (
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{currentUser.role}</p>
              </div>
              <Link to="/">
                <Button variant="outline">Logout</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
