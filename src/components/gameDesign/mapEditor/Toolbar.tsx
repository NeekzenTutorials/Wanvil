// src/components/gameDesign/mapEditor/Toolbar.tsx
// Top toolbar: mode toggle, drawing tools, active zone/layer selector

import type { FC } from 'react'
import type { MapState, EditTool, StickerTag } from '../../../types/gameDesign'
import {
  MousePointer2, Square, Pentagon, MapPin, Hand, Eye, Pencil,
} from 'lucide-react'

const TOOLS: { key: EditTool; icon: typeof Square; label: string; shortcut: string }[] = [
  { key: 'select', icon: MousePointer2, label: 'Sélection', shortcut: 'V' },
  { key: 'rect', icon: Square, label: 'Rectangle', shortcut: 'R' },
  { key: 'poly', icon: Pentagon, label: 'Polygone', shortcut: 'P' },
  { key: 'sticker', icon: MapPin, label: 'Autocollant', shortcut: 'S' },
  { key: 'pan', icon: Hand, label: 'Déplacer', shortcut: 'H' },
]

const STICKER_TAGS: { key: StickerTag; label: string }[] = [
  { key: 'key-item', label: '🔑 Clé' },
  { key: 'collectable', label: '⭐ Collectable' },
  { key: 'resource', label: '📦 Ressource' },
  { key: 'door', label: '🚪 Porte' },
  { key: 'save-point', label: '💾 Sauvegarde' },
  { key: 'enemy', label: '💀 Ennemi' },
  { key: 'npc', label: '👤 PNJ' },
  { key: 'custom', label: '📌 Autre' },
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
  const isEdit = state.mode === 'edit'

  return (
    <div className="flex items-center gap-2 flex-wrap bg-white border rounded-lg px-3 py-2 shadow-sm">
      {/* Mode toggle */}
      <div className="flex border rounded-md overflow-hidden mr-2">
        <button
          onClick={() => onSetMode('view')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${!isEdit ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Eye className="w-3.5 h-3.5" /> Visualisation
        </button>
        <button
          onClick={() => onSetMode('edit')}
          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium ${isEdit ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-50'}`}
        >
          <Pencil className="w-3.5 h-3.5" /> Édition
        </button>
      </div>

      {/* Drawing tools (edit only) */}
      {isEdit && (
        <>
          <div className="w-px h-6 bg-gray-200" />
          {TOOLS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => onSetTool(t.key)}
                className={`flex items-center gap-1 p-1.5 rounded ${state.tool === t.key ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title={`${t.label} (${t.shortcut})`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] text-gray-400 font-mono">{t.shortcut}</span>
              </button>
            )
          })}
        </>
      )}

      {/* Sticker tag selector (when sticker tool active) */}
      {isEdit && state.tool === 'sticker' && (
        <>
          <div className="w-px h-6 bg-gray-200" />
          <select
            value={stickerTag}
            onChange={e => onSetStickerTag(e.target.value as StickerTag)}
            className="text-xs border rounded px-2 py-1"
          >
            {STICKER_TAGS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </>
      )}

      {/* Poly finish button */}
      {isEdit && state.tool === 'poly' && polyPointsCount >= 3 && (
        <>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={onFinishPoly}
            className="text-xs bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
          >
            Terminer polygone ({polyPointsCount} pts)
          </button>
        </>
      )}
    </div>
  )
}
