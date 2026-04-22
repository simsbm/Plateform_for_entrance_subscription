import { createElement }      from 'react';
import { createBrowserRouter } from 'react-router';

import { LandingPage }        from './pages/landing-page';
import { LoginPage }          from './pages/login-page';
import { RegisterPage }       from './pages/register-page';
import { ApplicationFormPage } from './pages/application-form-page';
import { CandidateDashboard } from './pages/candidate-dashboard';
import { AgentDashboard }     from './pages/agent-dashboard';
import { AdminDashboard }     from './pages/admin-dashboard';
import { ResultCheckPage }    from './pages/result-check-page';
import { ProtectedRoute }     from './components/ProtectedRoute';

// ─── Routes publiques ─────────────────────────────────────────────────────────
const publicRoutes = [
  { path: '/',        Component: LandingPage },
  { path: '/login',   Component: LoginPage },
  { path: '/register', Component: RegisterPage },
  { path: '/results', Component: ResultCheckPage },
];

// ─── Groupes protégés ─────────────────────────────────────────────────────────
const candidatRoutes = {
  element: createElement(ProtectedRoute, { allowedRoles: ['CANDIDAT', 'ADMIN'] }),
  children: [
    { path: '/dashboard', Component: CandidateDashboard },
    { path: '/apply',     Component: ApplicationFormPage },
  ],
};

const agentRoutes = {
  element: createElement(ProtectedRoute, { allowedRoles: ['AGENT', 'ADMIN'] }),
  children: [
    { path: '/agent', Component: AgentDashboard },
  ],
};

const adminRoutes = {
  element: createElement(ProtectedRoute, { allowedRoles: ['ADMIN'] }),
  children: [
    { path: '/admin', Component: AdminDashboard },
  ],
};

// ─── Routeur ──────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  ...publicRoutes,
  candidatRoutes,
  agentRoutes,
  adminRoutes,
]);
