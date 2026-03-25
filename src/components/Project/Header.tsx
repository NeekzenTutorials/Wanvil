import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { MoveLeft } from 'lucide-react'
import { useTranslation } from '../../i18n'

export const ProjectHeader: FC<{ projectName?: string }> = ({ projectName }) => {
  const { t } = useTranslation()
  return (
    <header className="h-16 w-full bg-white dark:bg-gray-800 shadow flex items-center px-6 gap-4 shrink-0">
      <Link
        to="/project/open"
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition"
      >
        <MoveLeft className="w-6 h-6" />
        <span className="sr-only">{t('projectHeader.backToProjects')}</span>
      </Link>

      <h1 className="text-xl font-semibold leading-none truncate">
        {t('projectHeader.dashboard')} <span className="font-normal">{projectName ?? '…'}</span>
      </h1>
    </header>
  )
}
