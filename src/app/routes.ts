import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing-page";
import { LoginPage } from "./pages/login-page";
import { RegisterPage } from "./pages/register-page";
import { ApplicationFormPage } from "./pages/application-form-page";
import { CandidateDashboard } from "./pages/candidate-dashboard";
import { AdminDashboard } from "./pages/admin-dashboard";
import { ResultCheckPage } from "./pages/result-check-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/apply",
    Component: ApplicationFormPage,
  },
  {
    path: "/dashboard",
    Component: CandidateDashboard,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
  {
    path: "/results",
    Component: ResultCheckPage,
  },
]);
