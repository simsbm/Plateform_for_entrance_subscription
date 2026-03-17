import { Badge } from './ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'approved' | 'pending' | 'rejected' | 'verified' | 'completed' | 'processing';
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = false }: StatusBadgeProps) {
  const config = {
    approved: {
      className: 'bg-green-500 hover:bg-green-600',
      label: 'Approved',
      icon: CheckCircle
    },
    verified: {
      className: 'bg-green-500 hover:bg-green-600',
      label: 'Verified',
      icon: CheckCircle
    },
    completed: {
      className: 'bg-green-500 hover:bg-green-600',
      label: 'Completed',
      icon: CheckCircle
    },
    pending: {
      className: 'bg-yellow-500 hover:bg-yellow-600',
      label: 'Pending',
      icon: Clock
    },
    processing: {
      className: 'bg-blue-500 hover:bg-blue-600',
      label: 'Processing',
      icon: Clock
    },
    rejected: {
      className: 'bg-red-500 hover:bg-red-600',
      label: 'Rejected',
      icon: XCircle
    }
  };

  const statusConfig = config[status];
  const Icon = statusConfig.icon;

  return (
    <Badge className={statusConfig.className}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {statusConfig.label}
    </Badge>
  );
}
