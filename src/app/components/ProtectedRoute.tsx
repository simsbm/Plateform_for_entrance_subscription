import { Navigate, Outlet } from 'react-router';
import { getToken, getRole } from '../../lib/api';

interface ProtectedRouteProps {
  /** Rôles autorisés à accéder aux routes enfants */
  allowedRoles: string[];
}

/**
 * Garde de route :
 * - Pas de token          → redirect /login
 * - Rôle non autorisé     → redirect /login
 * - Sinon                 → rend les routes enfants via <Outlet>
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = getToken();
  const role  = getRole();

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
