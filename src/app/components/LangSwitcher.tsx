import { useTranslation } from 'react-i18next';
import { setLang } from '../../lib/i18n';

export function LangSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language as 'fr' | 'en';

  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-border bg-background p-0.5 text-sm font-medium">
      <button
        onClick={() => setLang('fr')}
        className={[
          'flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors',
          current === 'fr'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground',
        ].join(' ')}
        aria-label="Français"
      >
        <span>🇨🇲</span>
        <span>FR</span>
      </button>
      <button
        onClick={() => setLang('en')}
        className={[
          'flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors',
          current === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground',
        ].join(' ')}
        aria-label="English"
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
