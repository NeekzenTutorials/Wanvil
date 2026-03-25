// src/components/gameDesign/mapEditor/ZoneLayerPanel.tsx
// Right-side panel: zone & layer management

import { useState, type FC } from 'react'
import type { MapState } from '../../../types/gameDesign'
import {
  Plus, Trash2, Eye, EyeOff, Layers, MapPinned, Pencil, Check,
} from 'lucide-react'

interface Props {
  state: MapState
  onAddZone: (name: string) => void
  onRenameZone: (id: string, name: string) => void
  onDeleteZone: (id: string) => void
  onSetActiveZone: (id: string) => void
  onAddLayer: (zoneId: string, name: string) => void
  onToggleLayerVisible: (zoneId: string, layerIndex: number) => void
  onSetActiveLayer: (idx: number) => void
  onDeleteLayer: (zoneId: string, layerIndex: number) => void
}

export const ZoneLayerPanel: FC<Props> = ({
  state,
  onAddZone, onRenameZone, onDeleteZone, onSetActiveZone,
  onAddLayer, onToggleLayerVisible, onSetActiveLayer, onDeleteLayer,
}) => {
  const [newZoneName, setNewZoneName] = useState('')
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [editZoneName, setEditZoneName] = useState('')
  const [newLayerName, setNewLayerName] = useState('')

  const activeZone = state.zones.find(z => z.id === state.activeZoneId)

  return (
    <div className="w-64 bg-white border-l flex flex-col overflow-y-auto">
      {/* ─── Zones ─── */}
      <div className="p-3 border-b">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2">
          <MapPinned className="w-3.5 h-3.5" /> Zones
        </h3>
        <ul className="space-y-1">
          {state.zones.map(z => (
            <li key={z.id} className="group flex items-center gap-1">
              {editingZone === z.id ? (
                <form className="flex-1 flex gap-1" onSubmit={e => { e.preventDefault(); onRenameZone(z.id, editZoneName); setEditingZone(null) }}>
                  <input
                    value={editZoneName}
                    onChange={e => setEditZoneName(e.target.value)}
                    className="flex-1 text-xs border rounded px-1.5 py-0.5"
                    autoFocus
                  />
                  <button type="submit" className="p-0.5 text-green-600"><Check className="w-3.5 h-3.5" /></button>
                </form>
              ) : (
                <>
                  <button
                    onClick={() => onSetActiveZone(z.id)}
                    className={`flex-1 text-left text-xs px-2 py-1 rounded truncate ${z.id === state.activeZoneId ? 'bg-indigo-50 text-indigo-600 font-medium' : 'hover:bg-gray-50'}`}
                  >
                    {z.name}
                  </button>
                  <button
                    onClick={() => { setEditingZone(z.id); setEditZoneName(z.name) }}
                    className="p-0.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
                    title="Renommer"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  {state.zones.length > 1 && (
                    <button
                      onClick={() => onDeleteZone(z.id)}
                      className="p-0.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
        <form
          className="mt-2 flex gap-1"
          onSubmit={e => { e.preventDefault(); if (newZoneName.trim()) { onAddZone(newZoneName.trim()); setNewZoneName('') } }}
        >
          <input
            value={newZoneName}
            onChange={e => setNewZoneName(e.target.value)}
            placeholder="Nouvelle zone..."
            className="flex-1 text-xs border rounded px-2 py-1"
          />
          <button type="submit" className="p-1 text-indigo-500 hover:text-indigo-700"><Plus className="w-3.5 h-3.5" /></button>
        </form>
      </div>

      {/* ─── Layers ─── */}
      <div className="p-3 flex-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-2">
          <Layers className="w-3.5 h-3.5" /> Couches – {activeZone?.name ?? ''}
        </h3>
        {activeZone && (
          <>
            <ul className="space-y-1">
              {activeZone.layers.map(l => (
                <li key={l.index} className="group flex items-center gap-1">
                  <button
                    onClick={() => onSetActiveLayer(l.index)}
                    className={`flex-1 text-left text-xs px-2 py-1 rounded truncate ${l.index === state.activeLayerIndex ? 'bg-indigo-50 text-indigo-600 font-medium' : 'hover:bg-gray-50'}`}
                  >
                    {l.name}
                  </button>
                  <button
                    onClick={() => onToggleLayerVisible(state.activeZoneId, l.index)}
                    className="p-0.5 text-gray-400 hover:text-gray-600"
                    title={l.visible ? 'Masquer' : 'Afficher'}
                  >
                    {l.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  {activeZone.layers.length > 1 && (
                    <button
                      onClick={() => onDeleteLayer(state.activeZoneId, l.index)}
                      className="p-0.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <form
              className="mt-2 flex gap-1"
              onSubmit={e => { e.preventDefault(); if (newLayerName.trim()) { onAddLayer(state.activeZoneId, newLayerName.trim()); setNewLayerName('') } }}
            >
              <input
                value={newLayerName}
                onChange={e => setNewLayerName(e.target.value)}
                placeholder="Nouvel étage..."
                className="flex-1 text-xs border rounded px-2 py-1"
              />
              <button type="submit" className="p-1 text-indigo-500 hover:text-indigo-700"><Plus className="w-3.5 h-3.5" /></button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
