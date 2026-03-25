import { Globe, Sun, Moon, Monitor } from 'lucide-react'
import { useTranslation, type Lang } from '../../i18n'
import { useTheme, type Theme } from '../../theme'

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
]

const THEMES: { code: Theme; icon: typeof Sun; labelKey: 'settings.themeLight' | 'settings.themeDark' | 'settings.themeSystem' }[] = [
  { code: 'light', icon: Sun, labelKey: 'settings.themeLight' },
  { code: 'dark', icon: Moon, labelKey: 'settings.themeDark' },
  { code: 'system', icon: Monitor, labelKey: 'settings.themeSystem' },
]

export default function SettingsPage() {
  const { lang, setLang, t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('settings.title')}</h1>

      {/* Language */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Globe className="w-5 h-5" />
          {t('settings.language')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.languageDesc')}</p>

        <div className="flex gap-3">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                lang === l.code
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-400'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </section>

      {/* Theme */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Sun className="w-5 h-5" />
          {t('settings.theme')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.themeDesc')}</p>

        <div className="flex gap-3">
          {THEMES.map((th) => {
            const Icon = th.icon
            return (
              <button
                key={th.code}
                onClick={() => setTheme(th.code)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition flex items-center gap-2 ${
                  theme === th.code
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-400'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-600 dark:hover:border-gray-500 dark:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(th.labelKey)}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
