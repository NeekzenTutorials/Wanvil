// src/components/gameDesign/mapEditor/MapCanvas.tsx
// Main canvas renderer & interaction surface for the 2D map editor

import { useRef, useEffect, useCallback, useState, type FC, type MouseEvent as RME, type WheelEvent } from 'react'
import type { MapState, MapRoom, MapSticker, Point, StickerTag } from '../../../types/gameDesign'

/* ─── helpers ─── */
const STICKER_R = 10
const ROOM_MIN = 20

const STICKER_COLORS: Record<StickerTag, string> = {
  'key-item': '#eab308',
  collectable: '#22c55e',
  resource: '#3b82f6',
  door: '#a855f7',
  'save-point': '#06b6d4',
  enemy: '#ef4444',
  npc: '#f97316',
  custom: '#6b7280',
}

const STICKER_ICONS: Record<StickerTag, string> = {
  'key-item': '🔑',
  collectable: '⭐',
  resource: '📦',
  door: '🚪',
  'save-point': '💾',
  enemy: '💀',
  npc: '👤',
  custom: '📌',
}

interface Props {
  state: MapState
  onUpdateRoom: (id: string, patch: Partial<MapRoom>) => void
  onUpdateRoomLive: (id: string, patch: Partial<MapRoom>) => void
  onAddRoom: (room: Omit<MapRoom, 'id'>) => void
  onDeleteRoom: (id: string) => void
  onAddSticker: (x: number, y: number, tag: StickerTag, label: string) => void
  onUpdateStickerLive: (id: string, patch: Partial<MapSticker>) => void
  onDeleteSticker: (id: string) => void
  onCamera: (cam: Partial<MapState['camera']>) => void
  onSelectRoom: (room: MapRoom | null) => void
  onSelectSticker: (sticker: MapSticker | null) => void
  selectedRoomId: string | null
  selectedStickerId: string | null
  polyPoints: Point[]
  setPolyPoints: (p: Point[]) => void
  stickerTagToPlace: StickerTag
  /** Whether the Space key is held (temporary pan) */
  spaceHeld: boolean
  onSnapshotForDrag: () => void
}

export const MapCanvas: FC<Props> = ({
  state, onUpdateRoom, onUpdateRoomLive, onAddRoom,
  onAddSticker, onUpdateStickerLive,
  onCamera, onSelectRoom, onSelectSticker, selectedRoomId, selectedStickerId,
  polyPoints, setPolyPoints, stickerTagToPlace, spaceHeld, onSnapshotForDrag,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  /* ── drag state ── */
  const [dragState, setDragState] = useState<{
    type: 'pan' | 'move-room' | 'resize-room' | 'draw-rect' | 'move-sticker'
    startX: number; startY: number
    origX: number; origY: number; origW?: number; origH?: number
    targetId?: string
  } | null>(null)

  /* ── mouse world pos (for rect preview & cursor feedback) ── */
  const [mouseWorld, setMouseWorld] = useState<{ x: number; y: number } | null>(null)

  /* visible rooms & stickers filtered by active zone + visible layers */
  const activeZone = state.zones.find(z => z.id === state.activeZoneId)
  const visibleLayers = new Set(activeZone?.layers.filter(l => l.visible).map(l => l.index) ?? [])
  const rooms = state.rooms.filter(r => r.zoneId === state.activeZoneId && visibleLayers.has(r.layerIndex))
  const stickers = state.stickers.filter(s => s.zoneId === state.activeZoneId && visibleLayers.has(s.layerIndex))

  /* Current effective tool (Space overrides to pan) */
  const effectiveTool = spaceHeld ? 'pan' as const : state.tool

  /* ─── world ↔ screen ─── */
  const w2s = useCallback((wx: number, wy: number) => ({
    x: (wx + state.camera.x) * state.camera.zoom,
    y: (wy + state.camera.y) * state.camera.zoom,
  }), [state.camera])

  const s2w = useCallback((sx: number, sy: number) => ({
    x: sx / state.camera.zoom - state.camera.x,
    y: sy / state.camera.zoom - state.camera.y,
  }), [state.camera])

  /* ─── draw ─── */
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const { zoom } = state.camera

    // ── grid ──
    const gridSize = 40
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 0.5
    const startW = s2w(0, 0)
    const endW = s2w(rect.width, rect.height)
    const gx0 = Math.floor(startW.x / gridSize) * gridSize
    const gy0 = Math.floor(startW.y / gridSize) * gridSize
    for (let gx = gx0; gx <= endW.x; gx += gridSize) {
      const sp = w2s(gx, 0)
      ctx.beginPath(); ctx.moveTo(sp.x, 0); ctx.lineTo(sp.x, rect.height); ctx.stroke()
    }
    for (let gy = gy0; gy <= endW.y; gy += gridSize) {
      const sp = w2s(0, gy)
      ctx.beginPath(); ctx.moveTo(0, sp.y); ctx.lineTo(rect.width, sp.y); ctx.stroke()
    }

    // ── rooms ──
    for (const room of rooms) {
      const { x: sx, y: sy } = w2s(room.x, room.y)
      const sw = room.w * zoom
      const sh = room.h * zoom

      if (room.type === 'poly' && room.points && room.points.length >= 3) {
        ctx.beginPath()
        const p0 = w2s(room.x + room.points[0].x, room.y + room.points[0].y)
        ctx.moveTo(p0.x, p0.y)
        for (let i = 1; i < room.points.length; i++) {
          const p = w2s(room.x + room.points[i].x, room.y + room.points[i].y)
          ctx.lineTo(p.x, p.y)
        }
        ctx.closePath()
        ctx.fillStyle = room.color + '66'
        ctx.fill()
        ctx.strokeStyle = room.id === selectedRoomId ? '#4f46e5' : room.color
        ctx.lineWidth = room.id === selectedRoomId ? 3 : 1.5
        ctx.stroke()
      } else {
        ctx.fillStyle = room.color + '66'
        ctx.fillRect(sx, sy, sw, sh)
        ctx.strokeStyle = room.id === selectedRoomId ? '#4f46e5' : room.color
        ctx.lineWidth = room.id === selectedRoomId ? 3 : 1.5
        ctx.strokeRect(sx, sy, sw, sh)
      }

      // room name
      ctx.fillStyle = '#111827'
      ctx.font = `${Math.max(10, 12 * zoom)}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const cx = room.type === 'poly' && room.points
        ? w2s(
            room.x + room.points.reduce((a, p) => a + p.x, 0) / room.points.length,
            room.y + room.points.reduce((a, p) => a + p.y, 0) / room.points.length
          )
        : { x: sx + sw / 2, y: sy + sh / 2 }
      ctx.fillText(room.name, cx.x, cx.y)

      // resize handle (edit mode, selected rect)
      if (state.mode === 'edit' && room.id === selectedRoomId && room.type === 'rect') {
        ctx.fillStyle = '#4f46e5'
        ctx.fillRect(sx + sw - 6, sy + sh - 6, 12, 12)
      }
    }

    // ── rectangle drawing preview ──
    if (dragState?.type === 'draw-rect' && mouseWorld) {
      const rx = Math.min(dragState.startX, mouseWorld.x)
      const ry = Math.min(dragState.startY, mouseWorld.y)
      const rw = Math.abs(mouseWorld.x - dragState.startX)
      const rh = Math.abs(mouseWorld.y - dragState.startY)
      const { x: psx, y: psy } = w2s(rx, ry)
      const psw = rw * zoom
      const psh = rh * zoom
      ctx.fillStyle = '#6366f133'
      ctx.fillRect(psx, psy, psw, psh)
      ctx.strokeStyle = '#4f46e5'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(psx, psy, psw, psh)
      ctx.setLineDash([])
      // dimension label
      ctx.fillStyle = '#4f46e5'
      ctx.font = `${Math.max(10, 11 * zoom)}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(`${Math.round(rw)}×${Math.round(rh)}`, psx + psw / 2, psy + psh + 4)
    }

    // ── poly drawing preview ──
    if (effectiveTool === 'poly' && polyPoints.length > 0) {
      ctx.beginPath()
      const p0 = w2s(polyPoints[0].x, polyPoints[0].y)
      ctx.moveTo(p0.x, p0.y)
      for (let i = 1; i < polyPoints.length; i++) {
        const p = w2s(polyPoints[i].x, polyPoints[i].y)
        ctx.lineTo(p.x, p.y)
      }
      // line to cursor
      if (mouseWorld) {
        const mc = w2s(mouseWorld.x, mouseWorld.y)
        ctx.lineTo(mc.x, mc.y)
      }
      ctx.strokeStyle = '#4f46e5'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.stroke()
      ctx.setLineDash([])
      for (const pt of polyPoints) {
        const sp = w2s(pt.x, pt.y)
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#4f46e5'; ctx.fill()
      }
    }

    // ── stickers ──
    for (const st of stickers) {
      const sp = w2s(st.x, st.y)
      const r = STICKER_R * zoom
      ctx.beginPath()
      ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2)
      ctx.fillStyle = STICKER_COLORS[st.tag]
      ctx.fill()
      if (st.id === selectedStickerId) {
        ctx.strokeStyle = '#111827'; ctx.lineWidth = 2.5; ctx.stroke()
      }
      ctx.font = `${Math.max(10, 14 * zoom)}px serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(STICKER_ICONS[st.tag], sp.x, sp.y)
      if (st.label) {
        ctx.font = `${Math.max(8, 10 * zoom)}px Inter, sans-serif`
        ctx.fillStyle = '#374151'
        ctx.fillText(st.label, sp.x, sp.y + r + 8 * zoom)
      }
    }

    // ── zone/layer indicator ──
    const activeLayerObj = activeZone?.layers.find(l => l.index === state.activeLayerIndex)
    ctx.fillStyle = '#111827cc'
    ctx.font = '12px Inter, sans-serif'
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'
    ctx.fillText(`${activeZone?.name ?? ''} — ${activeLayerObj?.name ?? ''}`, 8, 8)
  }, [rooms, stickers, state.camera, state.mode, effectiveTool, selectedRoomId, selectedStickerId, polyPoints, w2s, s2w, dragState, mouseWorld, activeZone, state.activeLayerIndex])

  useEffect(() => { draw() }, [draw])
  useEffect(() => {
    const onResize = () => draw()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [draw])

  /* ─── hit tests ─── */
  const hitRoom = useCallback((wx: number, wy: number): MapRoom | null => {
    for (let i = rooms.length - 1; i >= 0; i--) {
      const r = rooms[i]
      if (r.type === 'rect') {
        if (wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h) return r
      } else if (r.points && r.points.length >= 3) {
        const pts = r.points.map(p => ({ x: r.x + p.x, y: r.y + p.y }))
        let inside = false
        for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
          if ((pts[a].y > wy) !== (pts[b].y > wy) &&
            wx < (pts[b].x - pts[a].x) * (wy - pts[a].y) / (pts[b].y - pts[a].y) + pts[a].x)
            inside = !inside
        }
        if (inside) return r
      }
    }
    return null
  }, [rooms])

  const hitSticker = useCallback((wx: number, wy: number): MapSticker | null => {
    for (let i = stickers.length - 1; i >= 0; i--) {
      const st = stickers[i]
      if (Math.hypot(wx - st.x, wy - st.y) <= STICKER_R + 4) return st
    }
    return null
  }, [stickers])

  const hitResizeHandle = useCallback((wx: number, wy: number): MapRoom | null => {
    if (!selectedRoomId) return null
    const r = rooms.find(rm => rm.id === selectedRoomId && rm.type === 'rect')
    if (!r) return null
    const hx = r.x + r.w, hy = r.y + r.h
    if (Math.abs(wx - hx) < 8 / state.camera.zoom && Math.abs(wy - hy) < 8 / state.camera.zoom) return r
    return null
  }, [rooms, selectedRoomId, state.camera.zoom])

  /* ─── coordinate helper ─── */
  const canvasXY = useCallback((e: RME | MouseEvent): { sx: number; sy: number; wx: number; wy: number } => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const { x: wx, y: wy } = s2w(sx, sy)
    return { sx, sy, wx, wy }
  }, [s2w])

  /* ─── wheel (zoom) ─── */
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const rect = canvasRef.current!.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    const oldZoom = state.camera.zoom
    const newZoom = Math.max(0.1, Math.min(5, oldZoom * factor))
    const wx = mx / oldZoom - state.camera.x
    const wy = my / oldZoom - state.camera.y
    onCamera({ zoom: newZoom, x: mx / newZoom - wx, y: my / newZoom - wy })
  }, [state.camera, onCamera])

  /* ─── mousedown ─── */
  const onMouseDown = useCallback((e: RME) => {
    const { sx, sy, wx, wy } = canvasXY(e)
    const isEdit = state.mode === 'edit'
    const tool = effectiveTool

    // Middle-click or pan tool → pan
    if (e.button === 1 || (e.button === 0 && tool === 'pan')) {
      setDragState({ type: 'pan', startX: sx, startY: sy, origX: state.camera.x, origY: state.camera.y })
      e.preventDefault()
      return
    }

    if (e.button !== 0) return

    // In edit mode, check if clicking a room/sticker regardless of current tool
    // (allows moving rooms with any tool, like real editors)
    if (isEdit && tool !== 'pan') {
      // resize handle first
      const rh = hitResizeHandle(wx, wy)
      if (rh) {
        onSnapshotForDrag()
        setDragState({ type: 'resize-room', startX: wx, startY: wy, origX: rh.x, origY: rh.y, origW: rh.w, origH: rh.h, targetId: rh.id })
        return
      }

      // sticker hit → select + drag
      const st = hitSticker(wx, wy)
      if (st) {
        onSelectSticker(st); onSelectRoom(null)
        onSnapshotForDrag()
        setDragState({ type: 'move-sticker', startX: wx, startY: wy, origX: st.x, origY: st.y, targetId: st.id })
        return
      }

      // room hit → select + drag
      const room = hitRoom(wx, wy)
      if (room) {
        onSelectRoom(room); onSelectSticker(null)
        onSnapshotForDrag()
        setDragState({ type: 'move-room', startX: wx, startY: wy, origX: room.x, origY: room.y, targetId: room.id })
        return
      }
    }

    // sticker tool → place sticker
    if (isEdit && tool === 'sticker') {
      onAddSticker(wx, wy, stickerTagToPlace, '')
      return
    }

    // poly tool → points are added in onClick
    if (isEdit && tool === 'poly') return

    // rect tool → start drawing
    if (isEdit && tool === 'rect') {
      onSelectRoom(null); onSelectSticker(null)
      setDragState({ type: 'draw-rect', startX: wx, startY: wy, origX: wx, origY: wy })
      return
    }

    // select tool in view mode – select items
    if (tool === 'select') {
      const st = hitSticker(wx, wy)
      if (st) { onSelectSticker(st); onSelectRoom(null); return }
      const room = hitRoom(wx, wy)
      if (room) { onSelectRoom(room); onSelectSticker(null); return }
      onSelectRoom(null); onSelectSticker(null)
      // pan fallback
      setDragState({ type: 'pan', startX: sx, startY: sy, origX: state.camera.x, origY: state.camera.y })
    }
  }, [state, effectiveTool, canvasXY, hitRoom, hitSticker, hitResizeHandle, onSelectRoom, onSelectSticker, onAddSticker, onCamera, stickerTagToPlace, onSnapshotForDrag])

  /* ─── mousemove ─── */
  const onMouseMove = useCallback((e: RME) => {
    // Always track mouse world position (for previews)
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      setMouseWorld(s2w(sx, sy))
    }

    if (!dragState) return
    const { sx, sy, wx, wy } = canvasXY(e)
    switch (dragState.type) {
      case 'pan': {
        const dx = sx - dragState.startX
        const dy = sy - dragState.startY
        onCamera({ x: dragState.origX + dx / state.camera.zoom, y: dragState.origY + dy / state.camera.zoom })
        break
      }
      case 'move-room': {
        if (dragState.targetId)
          onUpdateRoomLive(dragState.targetId, { x: dragState.origX + (wx - dragState.startX), y: dragState.origY + (wy - dragState.startY) })
        break
      }
      case 'resize-room': {
        if (dragState.targetId && dragState.origW != null && dragState.origH != null) {
          const nw = Math.max(ROOM_MIN, dragState.origW + (wx - dragState.startX))
          const nh = Math.max(ROOM_MIN, dragState.origH + (wy - dragState.startY))
          onUpdateRoomLive(dragState.targetId, { w: nw, h: nh })
        }
        break
      }
      case 'draw-rect': break // preview uses mouseWorld directly
      case 'move-sticker': {
        if (dragState.targetId)
          onUpdateStickerLive(dragState.targetId, { x: dragState.origX + (wx - dragState.startX), y: dragState.origY + (wy - dragState.startY) })
        break
      }
    }
  }, [dragState, canvasXY, onCamera, onUpdateRoomLive, onUpdateStickerLive, state.camera.zoom, s2w])

  /* ─── mouseup ─── */
  const onMouseUp = useCallback(() => {
    if (!dragState) return
    if (dragState.type === 'draw-rect' && mouseWorld) {
      const x = Math.min(dragState.startX, mouseWorld.x)
      const y = Math.min(dragState.startY, mouseWorld.y)
      const w = Math.abs(mouseWorld.x - dragState.startX)
      const h = Math.abs(mouseWorld.y - dragState.startY)
      if (w >= ROOM_MIN && h >= ROOM_MIN) {
        onAddRoom({
          name: 'Salle', type: 'rect', x, y, w, h, color: '#6366f1',
          zoneId: state.activeZoneId, layerIndex: state.activeLayerIndex,
        })
      }
    }
    // For move/resize operations, commit final position as a proper undo entry
    if (dragState.type === 'move-room' && dragState.targetId) {
      const room = state.rooms.find(r => r.id === dragState.targetId)
      if (room) onUpdateRoom(dragState.targetId, { x: room.x, y: room.y })
    }
    if (dragState.type === 'resize-room' && dragState.targetId) {
      const room = state.rooms.find(r => r.id === dragState.targetId)
      if (room) onUpdateRoom(dragState.targetId, { w: room.w, h: room.h })
    }
    if (dragState.type === 'move-sticker' && dragState.targetId) {
      // already committed via live — no extra action needed
    }
    setDragState(null)
  }, [dragState, mouseWorld, onAddRoom, onUpdateRoom, state])

  /* ─── click (poly points) ─── */
  const onClick = useCallback((e: RME) => {
    if (state.mode !== 'edit' || effectiveTool !== 'poly') return
    const { wx, wy } = canvasXY(e)
    setPolyPoints([...polyPoints, { x: wx, y: wy }])
  }, [state.mode, effectiveTool, canvasXY, polyPoints, setPolyPoints])

  /* ─── cursor ─── */
  const getCursor = () => {
    if (dragState?.type === 'pan') return 'grabbing'
    if (dragState?.type === 'resize-room') return 'nwse-resize'
    if (dragState?.type === 'move-room' || dragState?.type === 'move-sticker') return 'move'
    if (dragState?.type === 'draw-rect') return 'crosshair'
    if (effectiveTool === 'pan') return 'grab'
    if (effectiveTool === 'rect' || effectiveTool === 'poly') return 'crosshair'
    if (effectiveTool === 'sticker') return 'copy'
    return 'default'
  }

  return (
    <div ref={wrapRef} className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900 rounded-lg" tabIndex={-1}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => setMouseWorld(null)}
        onClick={onClick}
        onContextMenu={e => e.preventDefault()}
        style={{ cursor: getCursor() }}
      />
    </div>
  )
}
