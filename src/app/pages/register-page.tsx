import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { User, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, saveAuth } from '../../lib/api';
import axios from 'axios';

interface FieldErrors {
  email?: string[];
  password?: string[];
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading]       = useState(false);
  const [globalError, setGlobalError]   = useState<string | null>(null);
  const [fieldErrors, setFieldErrors]   = useState<FieldErrors>({});
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');

  const clearFieldError = (field: keyof FieldErrors) =>
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    if (password.length < 8) {
      setFieldErrors({ password: ['Le mot de passe doit contenir au moins 8 caractères'] });
      return;
    }
    if (password !== confirmPassword) {
      setFieldErrors({ password: ['Les mots de passe ne correspondent pas'] });
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await authApi.register(email, password);
      const { token, user } = data.data;
      saveAuth(token, user.role);
      toast.success('Compte créé ! Complétez votre dossier de candidature.');
      navigate('/apply');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const body = err.response?.data;
        if (body?.errors) {
          setFieldErrors(body.errors as FieldErrors);
        } else {
          setGlobalError(body?.message ?? 'Erreur lors de la création du compte');
        }
      } else {
        setGlobalError('Une erreur inattendue est survenue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-18 h-18 rounded-lg flex items-center justify-center">
              <img src="src\img\cropped-logo-supptic.png" alt="logo de supptic" />
            </div>
            <h1 className="text-lg font-bold text-primary">SUPPTIC</h1>
          </Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">Créer un compte</CardTitle>
            <CardDescription>
              Étape 1 / 2 — Identifiants de connexion
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@example.cm"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                    className={`pl-10 ${fieldErrors.email ? 'border-destructive' : ''}`}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>
                )}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="8 caractères minimum"
                    minLength={8}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                    className={`pl-10 ${fieldErrors.password ? 'border-destructive' : ''}`}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-destructive">{fieldErrors.password[0]}</p>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Répétez le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Erreur globale */}
              {globalError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{globalError}</span>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? 'Création en cours…' : 'Créer mon compte'}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Après la création du compte, vous serez dirigé vers le formulaire de candidature.
              </p>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Déjà un compte ?{' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Se connecter
                  </Link>
                </p>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
