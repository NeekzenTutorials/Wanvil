// src/components/gameDesign/mapEditor/MapEditorPage.tsx
// Root orchestrator component for the 2D Map Editor

import { useState, useCallback, useEffect, useRef, type FC } from 'react'
import type { MapRoom, MapSticker, MapState, Point, StickerTag } from '../../../types/gameDesign'
import { useMapState } from './useMapState'
import { MapCanvas } from './MapCanvas'
import { Toolbar } from './Toolbar'
import { ZoneLayerPanel } from './ZoneLayerPanel'
import { RoomProperties, StickerProperties } from './PropertiesPanel'
import { RoomBankPanel } from './RoomBankPanel'
import { Archive, Save } from 'lucide-react'
import { apiGet, apiPut } from '../../../utils/fetcher'

interface Props {
  projectId: string
  componentRecordId: string
}

interface ComponentRecord {
  id: string
  data: Partial<MapState>
}

export const MapEditorPage: FC<Props> = ({ projectId, componentRecordId }) => {
  const ms = useMapState()
  const { state } = ms

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null)
  const [polyPoints, setPolyPoints] = useState<Point[]>([])
  const [stickerTag, setStickerTag] = useState<StickerTag>('key-item')
  const [showBank, setShowBank] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  /* ─── Load map data from backend on mount ─── */
  useEffect(() => {
    if (!projectId || !componentRecordId) return
    apiGet<ComponentRecord>(`projects/${projectId}/game-design/${componentRecordId}`)
      .then(record => {
        const d = record.data
        if (d && d.zones && Array.isArray(d.zones) && d.zones.length > 0) {
          ms.loadFromData(d as Pick<MapState, 'zones' | 'rooms' | 'stickers' | 'roomBank'>)
        }
        setLoaded(true)
      })
      .catch(err => { console.error('Failed to load map data', err); setLoaded(true) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, componentRecordId])

  /* ─── Auto-save (debounced) ─── */
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevDataRef = useRef<string>('')

  useEffect(() => {
    if (!loaded || !projectId || !componentRecordId) return
    // Only save persistable data (no camera, mode, tool state)
    const persistable = {
      zones: state.zones,
      rooms: state.rooms,
      stickers: state.stickers,
      roomBank: state.roomBank,
    }
    const json = JSON.stringify(persistable)
    if (json === prevDataRef.current) return
    prevDataRef.current = json

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaving(true)
      apiPut(`projects/${projectId}/game-design/${componentRecordId}`, { data: persistable })
        .then(() => setSaving(false))
        .catch(err => { console.error('Auto-save failed', err); setSaving(false) })
    }, 1500) // debounce 1.5s

    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [state.zones, state.rooms, state.stickers, state.roomBank, loaded, projectId, componentRecordId])

  const selectedRoom = state.rooms.find(r => r.id === selectedRoomId) ?? null
  const selectedSticker = state.stickers.find(s => s.id === selectedStickerId) ?? null

  const handleSelectRoom = useCallback((room: MapRoom | null) => {
    setSelectedRoomId(room?.id ?? null)
    if (room) setSelectedStickerId(null)
  }, [])
  const handleSelectSticker = useCallback((sticker: MapSticker | null) => {
    setSelectedStickerId(sticker?.id ?? null)
    if (sticker) setSelectedRoomId(null)
  }, [])

  const finishPoly = useCallback(() => {
    if (polyPoints.length < 3) return
    const xs = polyPoints.map(p => p.x)
    const ys = polyPoints.map(p => p.y)
    const minX = Math.min(...xs), minY = Math.min(...ys)
    const maxX = Math.max(...xs), maxY = Math.max(...ys)
    const relPts = polyPoints.map(p => ({ x: p.x - minX, y: p.y - minY }))
    ms.addRoom({
      name: 'Salle',
      type: 'poly',
      x: minX, y: minY,
      w: maxX - minX, h: maxY - minY,
      points: relPts,
      color: '#6366f1',
      zoneId: state.activeZoneId,
      layerIndex: state.activeLayerIndex,
    })
    setPolyPoints([])
  }, [polyPoints, ms, state.activeZoneId, state.activeLayerIndex])

  const handleSaveToBank = useCallback((room: MapRoom) => {
    ms.saveToBank({
      name: room.name,
      type: room.type,
      w: room.w,
      h: room.h,
      points: room.points,
      color: room.color,
    })
  }, [ms])

  const handlePlaceFromBank = useCallback((templateId: string) => {
    // place at center-ish of current view
    const { x, y, zoom } = state.camera
    const cx = -x + 400 / zoom
    const cy = -y + 300 / zoom
    ms.placeFromBank(templateId, cx, cy)
  }, [ms, state.camera])

  /* ─── keyboard shortcuts ─── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      // Undo / Redo
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); ms.undo(); return }
      if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
          (e.key === 'y' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); ms.redo(); return }

      // Delete selected room or sticker
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRoomId) { ms.deleteRoom(selectedRoomId); setSelectedRoomId(null) }
        else if (selectedStickerId) { ms.deleteSticker(selectedStickerId); setSelectedStickerId(null) }
        return
      }

      // Escape — deselect / cancel poly
      if (e.key === 'Escape') {
        if (polyPoints.length > 0) { setPolyPoints([]); return }
        setSelectedRoomId(null); setSelectedStickerId(null)
        return
      }

      // Space — temp pan
      if (e.key === ' ' && !e.repeat) { e.preventDefault(); setSpaceHeld(true); return }

      // Tool shortcuts (edit mode only)
      if (state.mode === 'edit') {
        if (e.key === 'v' || e.key === 'V') { ms.setTool('select'); return }
        if (e.key === 'r' || e.key === 'R') { ms.setTool('rect'); return }
        if (e.key === 'p' || e.key === 'P') { ms.setTool('poly'); return }
        if (e.key === 's' || e.key === 'S') { ms.setTool('sticker'); return }
        if (e.key === 'h' || e.key === 'H') { ms.setTool('pan'); return }
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') setSpaceHeld(false)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [ms, selectedRoomId, selectedStickerId, polyPoints, state.mode])

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Éditeur de Map 2D</h2>
          {saving && <span className="text-xs text-gray-400 flex items-center gap-1"><Save className="w-3 h-3 animate-pulse" /> Sauvegarde…</span>}
        </div>
        <button
          onClick={() => setShowBank(!showBank)}
          className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded border ${showBank ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'hover:bg-gray-50'}`}
        >
          <Archive className="w-3.5 h-3.5" /> Banque de salles ({state.roomBank.length})
        </button>
      </div>

      {/* Toolbar */}
      <Toolbar
        state={state}
        onSetMode={ms.setMode}
        onSetTool={ms.setTool}
        stickerTag={stickerTag}
        onSetStickerTag={setStickerTag}
        onFinishPoly={finishPoly}
        polyPointsCount={polyPoints.length}
      />

      {/* Main layout */}
      <div className="flex flex-1 min-h-0 gap-2">
        {/* Canvas */}
        <div className="flex-1 flex flex-col min-w-0 gap-2">
          <MapCanvas
            state={state}
            onUpdateRoom={ms.updateRoom}
            onUpdateRoomLive={ms.updateRoomLive}
            onAddRoom={ms.addRoom}
            onDeleteRoom={ms.deleteRoom}
            onAddSticker={ms.addSticker}
            onUpdateStickerLive={ms.updateStickerLive}
            onDeleteSticker={ms.deleteSticker}
            onCamera={ms.setCamera}
            onSelectRoom={handleSelectRoom}
            onSelectSticker={handleSelectSticker}
            selectedRoomId={selectedRoomId}
            selectedStickerId={selectedStickerId}
            polyPoints={polyPoints}
            setPolyPoints={setPolyPoints}
            stickerTagToPlace={stickerTag}
            spaceHeld={spaceHeld}
            onSnapshotForDrag={ms.snapshotForDrag}
          />

          {/* Properties bar (under canvas) */}
          <div className="flex gap-2 flex-wrap">
            {selectedRoom && state.mode === 'edit' && (
              <RoomProperties
                room={selectedRoom}
                onUpdate={ms.updateRoom}
                onDelete={(id) => { ms.deleteRoom(id); setSelectedRoomId(null) }}
                onSaveToBank={handleSaveToBank}
              />
            )}
            {selectedRoom && state.mode === 'view' && (
              <div className="bg-white border rounded-lg p-3 shadow-sm">
                <p className="text-sm font-medium">{selectedRoom.name}</p>
                <p className="text-xs text-gray-500">
                  {selectedRoom.type === 'rect'
                    ? `${Math.round(selectedRoom.w)}×${Math.round(selectedRoom.h)}`
                    : `Polygone ${selectedRoom.points?.length ?? 0} pts`}
                </p>
              </div>
            )}
            {selectedSticker && state.mode === 'edit' && (
              <StickerProperties
                sticker={selectedSticker}
                onUpdate={ms.updateSticker}
                onDelete={(id) => { ms.deleteSticker(id); setSelectedStickerId(null) }}
              />
            )}
            {selectedSticker && state.mode === 'view' && (
              <div className="bg-white border rounded-lg p-3 shadow-sm">
                <p className="text-sm font-medium">{selectedSticker.label || '(sans nom)'}</p>
                <p className="text-xs text-gray-500">{selectedSticker.tag}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel: zones/layers + optional bank */}
        <div className="flex flex-col gap-2 shrink-0">
          <ZoneLayerPanel
            state={state}
            onAddZone={ms.addZone}
            onRenameZone={ms.renameZone}
            onDeleteZone={ms.deleteZone}
            onSetActiveZone={ms.setActiveZone}
            onAddLayer={ms.addLayer}
            onToggleLayerVisible={ms.toggleLayerVisibility}
            onSetActiveLayer={ms.setActiveLayer}
            onDeleteLayer={ms.deleteLayer}
          />
          {showBank && (
            <div className="w-64 bg-white border rounded-lg p-2 max-h-64 overflow-y-auto">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1 px-1">Banque de salles</h4>
              <RoomBankPanel
                templates={state.roomBank}
                onPlace={handlePlaceFromBank}
                onDelete={ms.deleteBankItem}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
