// src/components/gameDesign/mapEditor/RoomBankPanel.tsx
// Panel listing saved room templates (bank) and allowing placement

import type { FC } from 'react'
import type { RoomTemplate } from '../../../types/gameDesign'
import { Trash2, Plus } from 'lucide-react'
import { useTranslation } from '../../../i18n'

interface Props {
  templates: RoomTemplate[]
  onPlace: (templateId: string) => void
  onDelete: (templateId: string) => void
}

export const RoomBankPanel: FC<Props> = ({ templates, onPlace, onDelete }) => {
  const { t } = useTranslation()

  if (templates.length === 0) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-500 italic px-3 py-2">
        {t('mapEditor.noRoomBank')}
      </div>
    )
  }

  return (
    <div className="space-y-1 px-1">
      {templates.map(tpl => (
        <div key={tpl.id} className="group flex items-center gap-2 border dark:border-gray-600 rounded px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700">
          {/* Preview swatch */}
          <div className="w-6 h-6 rounded shrink-0 border" style={{ backgroundColor: tpl.color + '66', borderColor: tpl.color }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{tpl.name}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {tpl.type === 'rect' ? `${Math.round(tpl.w)}×${Math.round(tpl.h)}` : `${t('mapEditor.polygon')} ${tpl.points?.length ?? 0} pts`}
            </p>
          </div>
          <button onClick={() => onPlace(tpl.id)} className="p-1 text-indigo-500 hover:text-indigo-700" title={t('mapEditor.placeOnMap')}>
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(tpl.id)} className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100" title={t('common.delete')}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
