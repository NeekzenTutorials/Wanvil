// src/components/gameDesign/mapEditor/useMapState.ts
// Central state hook for the 2D map editor – with undo / redo

import { useState, useCallback, useRef } from 'react'
import type {
  MapState, MapRoom, MapSticker, MapZone,
  RoomTemplate, MapEditorMode, EditTool, StickerTag,
} from '../../../types/gameDesign'

let _counter = 0
const uid = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${++_counter}-${Math.random().toString(36).slice(2, 10)}`

const DEFAULT_ZONE: MapZone = { id: uid(), name: 'Zone 1', layers: [{ index: 0, name: '1F', visible: true }] }

const initialState = (): MapState => ({
  zones: [DEFAULT_ZONE],
  rooms: [],
  stickers: [],
  roomBank: [],
  activeZoneId: DEFAULT_ZONE.id,
  activeLayerIndex: 0,
  mode: 'view',
  tool: 'select',
  camera: { x: 0, y: 0, zoom: 1 },
})

/* fields that are UI-only (not tracked by undo) */
const uiKeys = new Set<keyof MapState>(['mode', 'tool', 'camera', 'activeZoneId', 'activeLayerIndex'])

function dataSnapshot(s: MapState) {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(s) as (keyof MapState)[]) if (!uiKeys.has(k)) out[k] = s[k]
  return out
}
function dataEqual(a: MapState, b: MapState) {
  return JSON.stringify(dataSnapshot(a)) === JSON.stringify(dataSnapshot(b))
}

const MAX_HISTORY = 80

export function useMapState() {
  const [state, _setState] = useState<MapState>(initialState)

  const undoStack = useRef<MapState[]>([])
  const redoStack = useRef<MapState[]>([])

  const pushUndo = useCallback((prev: MapState) => {
    const stack = undoStack.current
    if (stack.length > 0 && dataEqual(stack[stack.length - 1], prev)) return
    stack.push(prev)
    if (stack.length > MAX_HISTORY) stack.splice(0, stack.length - MAX_HISTORY)
    redoStack.current = []
  }, [])

  /** setState wrapper — auto-pushes undo when data changes */
  const setState = useCallback(
    (updater: MapState | ((s: MapState) => MapState), skipUndo = false) => {
      _setState(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        if (!skipUndo && !dataEqual(prev, next)) pushUndo(prev)
        return next
      })
    },
    [pushUndo],
  )

  const undo = useCallback(() => {
    _setState(cur => {
      const prev = undoStack.current.pop()
      if (!prev) return cur
      redoStack.current.push(cur)
      return { ...prev, mode: cur.mode, tool: cur.tool, camera: cur.camera, activeZoneId: cur.activeZoneId, activeLayerIndex: cur.activeLayerIndex }
    })
  }, [])

  const redo = useCallback(() => {
    _setState(cur => {
      const next = redoStack.current.pop()
      if (!next) return cur
      undoStack.current.push(cur)
      return { ...next, mode: cur.mode, tool: cur.tool, camera: cur.camera, activeZoneId: cur.activeZoneId, activeLayerIndex: cur.activeLayerIndex }
    })
  }, [])

  // ─── mode / tool ───
  const setMode = useCallback((mode: MapEditorMode) => setState(s => ({ ...s, mode, tool: mode === 'view' ? 'select' : s.tool }), true), [setState])
  const setTool = useCallback((tool: EditTool) => setState(s => ({ ...s, tool }), true), [setState])

  // ─── camera ───
  const setCamera = useCallback((cam: Partial<MapState['camera']>) => setState(s => ({ ...s, camera: { ...s.camera, ...cam } }), true), [setState])

  // ─── zones ───
  const addZone = useCallback((name: string) => {
    const z: MapZone = { id: uid(), name, layers: [{ index: 0, name: '1F', visible: true }] }
    setState(s => ({ ...s, zones: [...s.zones, z], activeZoneId: z.id, activeLayerIndex: 0 }))
  }, [setState])
  const renameZone = useCallback((id: string, name: string) =>
    setState(s => ({ ...s, zones: s.zones.map(z => z.id === id ? { ...z, name } : z) })), [setState])
  const setActiveZone = useCallback((id: string) =>
    setState(s => ({ ...s, activeZoneId: id, activeLayerIndex: 0 }), true), [setState])
  const deleteZone = useCallback((id: string) =>
    setState(s => {
      const zones = s.zones.filter(z => z.id !== id)
      if (zones.length === 0) return s
      return {
        ...s, zones,
        rooms: s.rooms.filter(r => r.zoneId !== id),
        stickers: s.stickers.filter(st => st.zoneId !== id),
        activeZoneId: s.activeZoneId === id ? zones[0].id : s.activeZoneId,
        activeLayerIndex: 0,
      }
    }), [setState])

  // ─── layers ───
  const addLayer = useCallback((zoneId: string, name: string) =>
    setState(s => ({
      ...s,
      zones: s.zones.map(z => {
        if (z.id !== zoneId) return z
        const idx = z.layers.length > 0 ? Math.max(...z.layers.map(l => l.index)) + 1 : 0
        return { ...z, layers: [...z.layers, { index: idx, name, visible: true }] }
      })
    })), [setState])
  const toggleLayerVisibility = useCallback((zoneId: string, layerIndex: number) =>
    setState(s => ({
      ...s,
      zones: s.zones.map(z => z.id !== zoneId ? z : {
        ...z, layers: z.layers.map(l => l.index === layerIndex ? { ...l, visible: !l.visible } : l)
      })
    }), true), [setState])
  const setActiveLayer = useCallback((idx: number) => setState(s => ({ ...s, activeLayerIndex: idx }), true), [setState])
  const deleteLayer = useCallback((zoneId: string, layerIndex: number) =>
    setState(s => ({
      ...s,
      zones: s.zones.map(z => z.id !== zoneId ? z : { ...z, layers: z.layers.filter(l => l.index !== layerIndex) }),
      rooms: s.rooms.filter(r => !(r.zoneId === zoneId && r.layerIndex === layerIndex)),
      stickers: s.stickers.filter(st => !(st.zoneId === zoneId && st.layerIndex === layerIndex)),
      activeLayerIndex: s.activeLayerIndex === layerIndex ? 0 : s.activeLayerIndex,
    })), [setState])

  // ─── rooms ───
  const addRoom = useCallback((room: Omit<MapRoom, 'id'>) =>
    setState(s => ({ ...s, rooms: [...s.rooms, { ...room, id: uid() }] })), [setState])
  const updateRoom = useCallback((id: string, patch: Partial<MapRoom>) =>
    setState(s => ({ ...s, rooms: s.rooms.map(r => r.id === id ? { ...r, ...patch } : r) })), [setState])
  /** Live update (skips undo push) for drag operations */
  const updateRoomLive = useCallback((id: string, patch: Partial<MapRoom>) =>
    setState(s => ({ ...s, rooms: s.rooms.map(r => r.id === id ? { ...r, ...patch } : r) }), true), [setState])
  const deleteRoom = useCallback((id: string) =>
    setState(s => ({ ...s, rooms: s.rooms.filter(r => r.id !== id) })), [setState])

  // ─── stickers ───
  const addSticker = useCallback((x: number, y: number, tag: StickerTag, label: string) =>
    setState(s => ({
      ...s,
      stickers: [...s.stickers, { id: uid(), x, y, tag, label, zoneId: s.activeZoneId, layerIndex: s.activeLayerIndex }]
    })), [setState])
  const updateSticker = useCallback((id: string, patch: Partial<MapSticker>) =>
    setState(s => ({ ...s, stickers: s.stickers.map(st => st.id === id ? { ...st, ...patch } : st) })), [setState])
  const updateStickerLive = useCallback((id: string, patch: Partial<MapSticker>) =>
    setState(s => ({ ...s, stickers: s.stickers.map(st => st.id === id ? { ...st, ...patch } : st) }), true), [setState])
  const deleteSticker = useCallback((id: string) =>
    setState(s => ({ ...s, stickers: s.stickers.filter(st => st.id !== id) })), [setState])

  // ─── room bank ───
  const saveToBank = useCallback((tpl: Omit<RoomTemplate, 'id'>) =>
    setState(s => ({ ...s, roomBank: [...s.roomBank, { ...tpl, id: uid() }] })), [setState])
  const deleteBankItem = useCallback((id: string) =>
    setState(s => ({ ...s, roomBank: s.roomBank.filter(t => t.id !== id) })), [setState])

  // ─── place from bank ───
  const placeFromBank = useCallback((templateId: string, x: number, y: number) =>
    setState(s => {
      const tpl = s.roomBank.find(t => t.id === templateId)
      if (!tpl) return s
      const room: MapRoom = {
        id: uid(), name: tpl.name, type: tpl.type, x, y, w: tpl.w, h: tpl.h,
        points: tpl.points, color: tpl.color,
        zoneId: s.activeZoneId, layerIndex: s.activeLayerIndex,
      }
      return { ...s, rooms: [...s.rooms, room] }
    }), [setState])

  /** Snapshot before a drag begins (one undo entry for the whole drag) */
  const snapshotForDrag = useCallback(() => {
    _setState(cur => { pushUndo(cur); return cur })
  }, [pushUndo])

  /** Load saved data from backend (replaces data fields, keeps UI defaults) */
  const loadFromData = useCallback((data: Pick<MapState, 'zones' | 'rooms' | 'stickers' | 'roomBank'>) => {
    _setState(cur => ({
      ...cur,
      zones: data.zones,
      rooms: data.rooms ?? [],
      stickers: data.stickers ?? [],
      roomBank: data.roomBank ?? [],
      activeZoneId: data.zones[0]?.id ?? cur.activeZoneId,
      activeLayerIndex: 0,
    }))
    undoStack.current = []
    redoStack.current = []
  }, [])

  return {
    state, setState,
    undo, redo,
    setMode, setTool, setCamera,
    addZone, renameZone, setActiveZone, deleteZone,
    addLayer, toggleLayerVisibility, setActiveLayer, deleteLayer,
    addRoom, updateRoom, updateRoomLive, deleteRoom,
    addSticker, updateSticker, updateStickerLive, deleteSticker,
    saveToBank, deleteBankItem, placeFromBank,
    snapshotForDrag, loadFromData,
  }
}
