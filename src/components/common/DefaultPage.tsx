import { useTranslation } from '../../i18n'

export function DefaultPage({ title, description }: { title: string; description: string }) {
    const { t } = useTranslation()
    return (
      <div className="max-w-3xl mx-auto mt-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{description}</p>
        <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('common.tip')}
          </p>
        </div>
      </div>
    )
  }
  