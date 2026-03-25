import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { MoveLeft, FileText } from 'lucide-react'
import { useTranslation } from '../../i18n'

interface Props {
  projectName?: string
  gddEnabled?: boolean
  onGddClick?: () => void
}

export const ProjectHeader: FC<Props> = ({ projectName, gddEnabled, onGddClick }) => {
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

      <h1 className="text-xl font-semibold leading-none truncate flex-1">
        {t('projectHeader.dashboard')} <span className="font-normal">{projectName ?? '…'}</span>
      </h1>

      {gddEnabled && onGddClick && (
        <button
          onClick={onGddClick}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition"
          title={t('gdd.headerTooltip')}
        >
          <FileText className="w-5 h-5 text-indigo-500" />
        </button>
      )}
    </header>
  )
}
