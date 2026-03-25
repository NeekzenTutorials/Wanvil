// src/components/gameDesign/GameDesignCatalog.tsx
// Shows available game design components as cards for the user to add to their project

import type { FC } from 'react'
import type { GameDesignComponent } from '../../types/gameDesign'
import { Map as MapIcon, KanbanSquare } from 'lucide-react'
import { useTranslation, type TranslationKey } from '../../i18n'

interface CatalogEntry {
  key: GameDesignComponent
  label: TranslationKey
  description: TranslationKey
  icon: typeof MapIcon
}

const CATALOG: CatalogEntry[] = [
  {
    key: 'map-editor',
    label: 'catalog.mapEditorLabel',
    description: 'catalog.mapEditorDesc',
    icon: MapIcon,
  },
  {
    key: 'task-board',
    label: 'catalog.taskBoardLabel',
    description: 'catalog.taskBoardDesc',
    icon: KanbanSquare,
  },
]

interface Props {
  enabledComponents: GameDesignComponent[]
  onAdd: (c: GameDesignComponent) => void
}

export const GameDesignCatalog: FC<Props> = ({ enabledComponents, onAdd }) => {
  const { t } = useTranslation()
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">{t('catalog.title')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('catalog.subtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATALOG.map(entry => {
          const Icon = entry.icon
          const isEnabled = enabledComponents.includes(entry.key)
          return (
            <div
              key={entry.key}
              className={`border rounded-xl p-5 flex flex-col gap-3 transition ${isEnabled ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-60' : 'bg-white dark:bg-gray-800 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-sm">{t(entry.label)}</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex-1">{t(entry.description)}</p>
              <button
                disabled={isEnabled}
                onClick={() => onAdd(entry.key)}
                className={`mt-auto text-xs font-medium px-4 py-2 rounded-lg transition ${isEnabled ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
              >
                {isEnabled ? t('catalog.alreadyAdded') : t('catalog.addToProject')}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
