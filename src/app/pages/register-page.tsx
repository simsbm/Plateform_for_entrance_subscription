import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { User, Mail, Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authApi, saveAuth } from '../../lib/api';
import { LangSwitcher } from '../components/LangSwitcher';
import axios from 'axios';

interface FieldErrors {
  email?: string[];
  password?: string[];
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading]     = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');

  const clearFieldError = (field: keyof FieldErrors) =>
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGlobalError(null);
    setFieldErrors({});

    if (password.length < 8) {
      setFieldErrors({ password: [t('auth.register.errorPasswordLength')] });
      return;
    }
    if (password !== confirmPassword) {
      setFieldErrors({ password: [t('auth.register.errorPasswordMatch')] });
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await authApi.register(email, password);
      const { token, user } = data.data;
      saveAuth(token, user.role);
      toast.success(t('auth.register.successToast'));
      navigate('/apply');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const body = err.response?.data;
        if (body?.errors) {
          setFieldErrors(body.errors as FieldErrors);
        } else {
          setGlobalError(body?.message ?? t('auth.register.defaultError'));
        }
      } else {
        setGlobalError(t('common.unexpectedError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src="src\img\cropped-logo-supptic.png" alt="logo SUPPTIC" className="h-10" />
            <h1 className="text-lg font-bold text-primary">{t('common.appName')}</h1>
          </Link>
          <LangSwitcher />
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" />
          {t('common.backHome')}
        </Link>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl">{t('auth.register.title')}</CardTitle>
            <CardDescription>{t('auth.register.subtitle')}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.register.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email" type="email"
                    placeholder={t('auth.register.emailPlaceholder')}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                    className={`pl-10 ${fieldErrors.email ? 'border-destructive' : ''}`}
                    required disabled={isLoading} autoComplete="email"
                  />
                </div>
                {fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.register.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password" type="password" minLength={8}
                    placeholder={t('auth.register.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                    className={`pl-10 ${fieldErrors.password ? 'border-destructive' : ''}`}
                    required disabled={isLoading} autoComplete="new-password"
                  />
                </div>
                {fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password[0]}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.register.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword" type="password"
                    placeholder={t('auth.register.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10"
                    required disabled={isLoading} autoComplete="new-password"
                  />
                </div>
              </div>

              {globalError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{globalError}</span>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? t('auth.register.submitting') : t('auth.register.submit')}
              </Button>

              <p className="text-xs text-center text-muted-foreground">{t('auth.register.hint')}</p>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t('auth.register.alreadyAccount')}{' '}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    {t('auth.register.loginLink')}
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
