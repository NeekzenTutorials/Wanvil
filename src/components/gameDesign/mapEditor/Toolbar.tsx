// src/components/gameDesign/mapEditor/Toolbar.tsx
// Top toolbar: mode toggle, drawing tools, active zone/layer selector

import type { FC } from 'react'
import type { MapState, EditTool, StickerTag } from '../../../types/gameDesign'
import { useTranslation } from '../../../i18n'
import type { TranslationKey } from '../../../i18n'
import {
  MousePointer2, Square, Pentagon, MapPin, Hand, Eye, Pencil,
} from 'lucide-react'

const TOOLS: { key: EditTool; icon: typeof Square; label: TranslationKey; shortcut: string }[] = [
  { key: 'select', icon: MousePointer2, label: 'mapEditor.select', shortcut: 'V' },
  { key: 'rect', icon: Square, label: 'mapEditor.rectangle', shortcut: 'R' },
  { key: 'poly', icon: Pentagon, label: 'mapEditor.polygon', shortcut: 'P' },
  { key: 'sticker', icon: MapPin, label: 'mapEditor.sticker', shortcut: 'S' },
  { key: 'pan', icon: Hand, label: 'mapEditor.move', shortcut: 'H' },
]

const STICKER_TAGS: { key: StickerTag; label: TranslationKey }[] = [
  { key: 'key-item', label: 'mapEditor.stickerKeyItem' },
  { key: 'collectable', label: 'mapEditor.stickerCollectable' },
  { key: 'resource', label: 'mapEditor.stickerResource' },
  { key: 'door', label: 'mapEditor.stickerDoor' },
  { key: 'save-point', label: 'mapEditor.stickerSave' },
  { key: 'enemy', label: 'mapEditor.stickerEnemy' },
  { key: 'npc', label: 'mapEditor.stickerNpc' },
  { key: 'custom', label: 'mapEditor.stickerCustom' },
]

interface Props {
  state: MapState
  onSetMode: (m: MapState['mode']) => void
  onSetTool: (t: EditTool) => void
  stickerTag: StickerTag
  onSetStickerTag: (t: StickerTag) => void
  onFinishPoly: () => void
  polyPointsCount: number
}

export const Toolbar: FC<Props> = ({
  state, onSetMode, onSetTool,
  stickerTag, onSetStickerTag, onFinishPoly, polyPointsCount,
}) => {
  const { t } = useTranslation()
  const isEdit = state.mode === 'edit'

  return (
    <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">
      {/* Mode toggle */}
      <div className="flex border dark:border-gray-600 rounded-md overflow-hidden mr-2">
        <button
          onClick={() => onSetMode('view')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${!isEdit ? 'bg-indigo-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
        >
          <Eye className="w-3.5 h-3.5" /> {t('mapEditor.view')}
        </button>
        <button
          onClick={() => onSetMode('edit')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${isEdit ? 'bg-indigo-500 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
        >
          <Pencil className="w-3.5 h-3.5" /> {t('mapEditor.editMode')}
        </button>
      </div>

      {/* Drawing tools (edit only) */}
      {isEdit && (
        <>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
          {TOOLS.map(td => {
            const Icon = td.icon
            return (
              <button
                key={td.key}
                onClick={() => onSetTool(td.key)}
                className={`flex items-center gap-1 p-1.5 rounded ${state.tool === td.key ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title={`${t(td.label)} (${td.shortcut})`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{td.shortcut}</span>
              </button>
            )
          })}
        </>
      )}

      {/* Sticker tag selector (when sticker tool active) */}
      {isEdit && state.tool === 'sticker' && (
        <>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
          <select
            value={stickerTag}
            onChange={e => onSetStickerTag(e.target.value as StickerTag)}
            className="text-xs border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-gray-100"
          >
            {STICKER_TAGS.map(s => (
              <option key={s.key} value={s.key}>{t(s.label)}</option>
            ))}
          </select>
        </>
      )}

      {/* Poly finish button */}
      {isEdit && state.tool === 'poly' && polyPointsCount >= 3 && (
        <>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
          <button
            onClick={onFinishPoly}
            className="text-xs bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
          >
            {t('mapEditor.finishPoly')} ({polyPointsCount} pts)
          </button>
        </>
      )}
    </div>
  )
}
