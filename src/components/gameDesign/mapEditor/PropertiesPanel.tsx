// src/components/gameDesign/mapEditor/PropertiesPanel.tsx
// Bottom / side panel for editing room or sticker properties

import { useState, type FC, useEffect } from 'react'
import type { MapRoom, MapSticker, StickerTag } from '../../../types/gameDesign'
import { Save, Trash2, Archive } from 'lucide-react'

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6',
  '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#64748b',
]

const STICKER_TAGS: { key: StickerTag; label: string }[] = [
  { key: 'key-item', label: '🔑 Objet clé' },
  { key: 'collectable', label: '⭐ Collectable' },
  { key: 'resource', label: '📦 Ressource' },
  { key: 'door', label: '🚪 Porte' },
  { key: 'save-point', label: '💾 Sauvegarde' },
  { key: 'enemy', label: '💀 Ennemi' },
  { key: 'npc', label: '👤 PNJ' },
  { key: 'custom', label: '📌 Autre' },
]

interface RoomProps {
  room: MapRoom
  onUpdate: (id: string, patch: Partial<MapRoom>) => void
  onDelete: (id: string) => void
  onSaveToBank: (room: MapRoom) => void
}

export const RoomProperties: FC<RoomProps> = ({ room, onUpdate, onDelete, onSaveToBank }) => {
  const [name, setName] = useState(room.name)
  useEffect(() => setName(room.name), [room.id, room.name])

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase">Propriétés – Salle</h4>

      {/* Name */}
      <div>
        <label className="text-xs text-gray-600">Nom</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => onUpdate(room.id, { name })}
          onKeyDown={e => { if (e.key === 'Enter') onUpdate(room.id, { name }) }}
          className="w-full text-sm border rounded px-2 py-1 mt-0.5"
        />
      </div>

      {/* Color */}
      <div>
        <label className="text-xs text-gray-600">Couleur</label>
        <div className="flex gap-1 mt-1 flex-wrap">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => onUpdate(room.id, { color: c })}
              className={`w-6 h-6 rounded-full border-2 ${room.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={room.color}
            onChange={e => onUpdate(room.id, { color: e.target.value })}
            className="w-6 h-6 rounded cursor-pointer border-0 p-0"
            title="Couleur personnalisée"
          />
        </div>
      </div>

      {/* Size (rect only) */}
      {room.type === 'rect' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-gray-600">Largeur</label>
            <input type="number" value={Math.round(room.w)} onChange={e => onUpdate(room.id, { w: +e.target.value })} className="w-full text-sm border rounded px-2 py-1 mt-0.5" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-600">Hauteur</label>
            <input type="number" value={Math.round(room.h)} onChange={e => onUpdate(room.id, { h: +e.target.value })} className="w-full text-sm border rounded px-2 py-1 mt-0.5" />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSaveToBank(room)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800" title="Sauver dans la banque">
          <Archive className="w-3.5 h-3.5" /> Banque
        </button>
        <button onClick={() => onDelete(room.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 ml-auto">
          <Trash2 className="w-3.5 h-3.5" /> Supprimer
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
  const [label, setLabel] = useState(sticker.label)
  useEffect(() => setLabel(sticker.label), [sticker.id, sticker.label])

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase">Propriétés – Autocollant</h4>

      <div>
        <label className="text-xs text-gray-600">Étiquette</label>
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          onBlur={() => onUpdate(sticker.id, { label })}
          onKeyDown={e => { if (e.key === 'Enter') onUpdate(sticker.id, { label }) }}
          className="w-full text-sm border rounded px-2 py-1 mt-0.5"
        />
      </div>

      <div>
        <label className="text-xs text-gray-600">Tag</label>
        <select
          value={sticker.tag}
          onChange={e => onUpdate(sticker.id, { tag: e.target.value as StickerTag })}
          className="w-full text-sm border rounded px-2 py-1 mt-0.5"
        >
          {STICKER_TAGS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      <button onClick={() => onDelete(sticker.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
        <Trash2 className="w-3.5 h-3.5" /> Supprimer
      </button>
    </div>
  )
}
