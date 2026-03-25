import { Globe, Sun, Moon, Monitor, FileText, Pencil, Eye } from 'lucide-react'
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

interface Props {
  gddEnabled?: boolean
  onToggleGdd?: () => void
  onEditGdd?: () => void
  onViewGdd?: () => void
}

export default function SettingsPage({ gddEnabled, onToggleGdd, onEditGdd, onViewGdd }: Props) {
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

      {/* GDD */}
      {onToggleGdd && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FileText className="w-5 h-5" />
            {t('gdd.sectionTitle')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('gdd.sectionDesc')}</p>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleGdd}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                gddEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={gddEnabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  gddEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {gddEnabled ? t('gdd.enabled') : t('gdd.disabled')}
            </span>
          </div>

          {gddEnabled && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={onEditGdd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
              >
                <Pencil className="w-4 h-4" />
                {t('gdd.editBtn')}
              </button>
              <button
                onClick={onViewGdd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <Eye className="w-4 h-4" />
                {t('gdd.viewBtn')}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
