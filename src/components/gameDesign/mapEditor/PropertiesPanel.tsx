// src/components/gameDesign/mapEditor/PropertiesPanel.tsx
// Bottom / side panel for editing room or sticker properties

import { useState, type FC, useEffect } from 'react'
import type { MapRoom, MapSticker, StickerTag } from '../../../types/gameDesign'
import { Trash2, Archive } from 'lucide-react'
import { useTranslation } from '../../../i18n'
import type { TranslationKey } from '../../../i18n'

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#64748b',
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

interface RoomProps {
  room: MapRoom
  onUpdate: (id: string, patch: Partial<MapRoom>) => void
  onDelete: (id: string) => void
  onSaveToBank: (room: MapRoom) => void
}

export const RoomProperties: FC<RoomProps> = ({ room, onUpdate, onDelete, onSaveToBank }) => {
  const { t } = useTranslation()
  const [name, setName] = useState(room.name)
  useEffect(() => setName(room.name), [room.id, room.name])

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-3 shadow-sm space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('mapEditor.propertiesRoom')}</h4>

      {/* Name */}
      <div>
        <label className="text-xs text-gray-600 dark:text-gray-400">{t('common.name')}</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => onUpdate(room.id, { name })}
          onKeyDown={e => { if (e.key === 'Enter') onUpdate(room.id, { name }) }}
          className="w-full text-sm border dark:border-gray-600 rounded px-2 py-1 mt-0.5 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-xs text-gray-600 dark:text-gray-400">Couleur</label>
        <div className="flex gap-1 mt-1 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => onUpdate(room.id, { color: c })}
              className={`w-6 h-6 rounded-full border-2 ${room.color === c ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={room.color}
            onChange={e => onUpdate(room.id, { color: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            title={t('mapEditor.customColor')}
          />
        </div>
      </div>

      {/* Size (rect only) */}
      {room.type === 'rect' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">{t('mapEditor.width')}</label>
            <input type="number" value={Math.round(room.w)} onChange={e => onUpdate(room.id, { w: +e.target.value })} className="w-full text-sm border dark:border-gray-600 rounded px-2 py-1 mt-0.5 dark:bg-gray-700 dark:text-gray-100" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-600 dark:text-gray-400">{t('mapEditor.height')}</label>
            <input type="number" value={Math.round(room.h)} onChange={e => onUpdate(room.id, { h: +e.target.value })} className="w-full text-sm border dark:border-gray-600 rounded px-2 py-1 mt-0.5 dark:bg-gray-700 dark:text-gray-100" />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSaveToBank(room)} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300" title={t('mapEditor.saveToBank')}>
          <Archive className="w-3.5 h-3.5" /> {t('mapEditor.saveToBank')}
        </button>
        <button onClick={() => onDelete(room.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-auto">
          <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
        </button>
      </div>
    </div>
  )
}

interface StickerProps {
  sticker: MapSticker
  onUpdate: (id: string, patch: Partial<MapSticker>) => void
  onDelete: (id: string) => void
}

export const StickerProperties: FC<StickerProps> = ({ sticker, onUpdate, onDelete }) => {
  const { t } = useTranslation()
  const [label, setLabel] = useState(sticker.label)
  useEffect(() => setLabel(sticker.label), [sticker.id, sticker.label])

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-3 shadow-sm space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">{t('mapEditor.propertiesSticker')}</h4>

      <div>
        <label className="text-xs text-gray-600 dark:text-gray-400">{t('mapEditor.label')}</label>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={() => onUpdate(sticker.id, { label })}
          onKeyDown={e => { if (e.key === 'Enter') onUpdate(sticker.id, { label }) }}
          className="w-full text-sm border dark:border-gray-600 rounded px-2 py-1 mt-0.5 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="text-xs text-gray-600 dark:text-gray-400">{t('mapEditor.tag')}</label>
        <select
          value={sticker.tag}
          onChange={e => onUpdate(sticker.id, { tag: e.target.value as StickerTag })}
          className="w-full text-sm border dark:border-gray-600 rounded px-2 py-1 mt-0.5 dark:bg-gray-700 dark:text-gray-100"
        >
          {STICKER_TAGS.map(s => <option key={s.key} value={s.key}>{t(s.label)}</option>)}
        </select>
      </div>

      <button onClick={() => onDelete(sticker.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
        <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
      </button>
    </div>
  )
}
