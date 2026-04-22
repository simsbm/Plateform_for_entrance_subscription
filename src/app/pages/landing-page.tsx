import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { GraduationCap, FileText, Upload, CreditCard, Download, CheckCircle, ArrowRight, Users, Award, Globe } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { UserGuideModal } from '../components/user-guide-modal';
import { LangSwitcher } from '../components/LangSwitcher';

export function LandingPage() {
  const { t } = useTranslation();

  const programs = [
    { id: 'itt', tKey: 'landing.programs.itt', Icon: GraduationCap },
    { id: 'ipt', tKey: 'landing.programs.ipt', Icon: FileText },
    { id: 'tt',  tKey: 'landing.programs.tt',  Icon: GraduationCap },
    { id: 'cpt', tKey: 'landing.programs.cpt', Icon: GraduationCap },
  ];

  const processSteps = [
    { tKey: 'landing.process.steps.account',  Icon: Users },
    { tKey: 'landing.process.steps.form',     Icon: FileText },
    { tKey: 'landing.process.steps.docs',     Icon: Upload },
    { tKey: 'landing.process.steps.payment',  Icon: CreditCard },
    { tKey: 'landing.process.steps.download', Icon: Download },
  ];

  const stats = [
    { value: '10 000+', tKey: 'landing.stats.candidates', Icon: Users },
    { value: '8',       tKey: 'landing.stats.programs',   Icon: GraduationCap },
    { value: '95%',     tKey: 'landing.stats.successRate', Icon: Award },
    { value: '10',      tKey: 'landing.stats.centers',    Icon: Globe },
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="src\img\cropped-logo-supptic.png" alt="logo SUPPTIC" className="h-10" />
              <div>
                <h1 className="text-xl font-bold text-primary">{t('common.appName')}</h1>
                <p className="text-xs text-muted-foreground">{t('common.schoolFull')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LangSwitcher />
              <UserGuideModal />
              <Link to="/results">
                <Button variant="ghost">{t('nav.checkResults')}</Button>
              </Link>
              <Link to="/login">
                <Button variant="outline">{t('nav.login')}</Button>
              </Link>
              <Link to="/register">
                <Button>{t('nav.register')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-secondary text-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{t('landing.officialBadge')}</span>
              </div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                {t('landing.heroTitle')}
              </h1>
              <p className="text-xl mb-8 text-blue-100">{t('landing.heroSubtitle')}</p>
              <div className="flex gap-4">
                <Link to="/register">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-white">
                    {t('landing.registerNow')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    {t('landing.learnMore')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="src\img\IMG_4052.jpg"
                  alt="Students studying telecommunications"
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(({ value, tKey, Icon }) => (
              <div key={tKey} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">{value}</div>
                <div className="text-muted-foreground">{t(tKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">{t('landing.programs.title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('landing.programs.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {programs.map(({ id, tKey }) => (
              <Card key={id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-2xl">{t(`${tKey}.title`)}</CardTitle>
                    <div className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-sm font-medium shrink-0 ml-2">
                      {t(`${tKey}.level`)}
                    </div>
                  </div>
                  <CardDescription className="text-base">{t(`${tKey}.description`)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      <span>{t(`${tKey}.duration`)}</span>
                    </div>
                    <Link to="/register">
                      <Button>{t('landing.programs.applyNow')}</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">{t('landing.process.title')}</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t('landing.process.subtitle')}</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent -translate-y-1/2" style={{ zIndex: 0 }} />
            <div className="grid md:grid-cols-5 gap-8 relative" style={{ zIndex: 1 }}>
              {processSteps.map(({ tKey, Icon }, index) => (
                <div key={tKey} className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 bg-white border-4 border-primary rounded-full flex items-center justify-center shadow-lg">
                      <Icon className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white font-bold shadow">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{t(`${tKey}.title`)}</h3>
                  <p className="text-sm text-muted-foreground">{t(`${tKey}.description`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('landing.cta.title')}</h2>
          <p className="text-xl mb-8 text-blue-100">{t('landing.cta.subtitle')}</p>
          <div className="flex gap-4 justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                {t('landing.cta.createAccount')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                {t('landing.cta.alreadyRegistered')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold mb-4">{t('common.appName')}</h3>
              <p className="text-sm text-blue-200">{t('common.schoolFull')}</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.footer.links')}</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="text-blue-200 hover:text-white">{t('nav.register')}</Link></li>
                <li><Link to="/login" className="text-blue-200 hover:text-white">{t('nav.login')}</Link></li>
                <li><Link to="/results" className="text-blue-200 hover:text-white">{t('nav.checkResults')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.footer.programs')}</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li>ITT</li><li>IPT</li><li>TT</li><li>CPT</li>
                <li>ITT_ALT</li><li>IPT_ALT</li><li>IT</li><li>APT</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t('landing.footer.contact')}</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li>info@supptic.cm</li>
                <li>+237 222 XX XX XX</li>
                <li>Yaoundé, Cameroun</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm text-blue-200">
            <p>{t('landing.footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
