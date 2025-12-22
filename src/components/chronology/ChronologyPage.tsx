import { useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { apiGet, apiPost, apiPut } from '../../utils/fetcher'
import { EventsForm } from '../events/EventsForm'
import { EventView } from '../events/EventView'

type Collection = { id: string; name: string }

type EventTag = { id: string; name: string; color?: string | null; note?: string | null }

type EventCard = {
  id: string
  name: string
  startDate: string
  endDate: string | null
  description?: string
  coverUrl?: string | null
  tags?: EventTag[]
}

type TimelineItem = {
  id: string
  eventId: string
  label?: string
  color?: string
  noteHtml?: string
  lane?: number
  /** Canvas rendering mode */
  displayMode?: 'header' | 'paragraph'
  /** Optional custom paragraph (plain text). If empty, we fallback to first paragraph of event description. */
  paragraph?: string
  /** Canvas coordinates (persisted). If missing, we auto-place from dates/lanes. */
  x?: number
  y?: number
  /** Optional persisted dimensions (canvas). */
  w?: number
  h?: number
}

type TimelineData = {
  version: 1
  items: TimelineItem[]
  options?: {
    title?: string
    description?: string
  }
}

type TimelineApiPayload = { id?: string; collectionId: string; data: TimelineData }

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function parseISODateToDayNumber(iso: string): number {
  // iso: YYYY-MM-DD
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
  return Math.floor(dt.getTime() / 86400000)
}

function formatISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function todayISO() {
  return formatISO(new Date())
}

function pickDefaultColorFromTags(tags?: EventTag[]): string | undefined {
  const c = tags?.find(t => !!t.color)?.color
  return c ?? undefined
}

function uniqBy<T>(arr: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const x of arr) {
    const k = key(x)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(x)
  }
  return out
}

function getYearFromISO(iso: string | undefined): number | null {
  if (!iso) return null
  const m = /^(-?\d{1,6})-\d{2}-\d{2}/.exec(iso)
  if (!m) return null
  const y = Number(m[1])
  return Number.isFinite(y) ? y : null
}

function stripHtmlToText(input: string): string {
  const s = (input || '').toString()
  if (!s.trim()) return ''
  if (typeof document === 'undefined') return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  const el = document.createElement('div')
  el.innerHTML = s
  return (el.textContent || '').replace(/\s+/g, ' ').trim()
}

function firstParagraphText(descriptionOrHtml: string): string {
  const text = stripHtmlToText(descriptionOrHtml)
  if (!text) return ''
  const parts = text.split(/\n\s*\n|\r\n\s*\r\n/).map(p => p.trim()).filter(Boolean)
  return (parts[0] || text).trim()
}

function clampText(s: string, maxChars: number): string {
  const t = (s || '').trim()
  if (t.length <= maxChars) return t
  return t.slice(0, maxChars - 1).trimEnd() + '…'
}

export function ChronologyPage({ projectId }: { projectId: string }) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionId, setCollectionId] = useState<string>('')

  const [showEventsList, setShowEventsList] = useState(true)

  const [events, setEvents] = useState<EventCard[]>([])
  const [q, setQ] = useState('')

  const [loadingEvents, setLoadingEvents] = useState(false)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [savingTimeline, setSavingTimeline] = useState(false)
  const [error, setError] = useState<string>('')

  const [timeline, setTimeline] = useState<TimelineData>({ version: 1, items: [], options: { title: '', description: '' } })

  // canvas UI state (not persisted in DB)
  const [zoomPct, setZoomPct] = useState<number>(100)
  const canvasViewportRef = useRef<HTMLDivElement | null>(null)
  const canvasInnerRef = useRef<HTMLDivElement | null>(null)
  const dragStateRef = useRef<null | {
    itemId: string
    startClientX: number
    startClientY: number
    startX: number
    startY: number
  }>(null)

  const dragMovedRef = useRef(false)

  const panStateRef = useRef<null | {
    pointerId: number
    startClientX: number
    startClientY: number
    startScrollLeft: number
    startScrollTop: number
  }>(null)

  const [isPanning, setIsPanning] = useState(false)

  // modals
  const [viewingEventId, setViewingEventId] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  // selected timeline item
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)

  const saveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    apiGet<Collection[]>(`projects/${projectId}/collections`).then(cols => {
      setCollections(cols)
      if (cols.length && !collectionId) setCollectionId(cols[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchEvents = async () => {
    if (!collectionId) return
    setLoadingEvents(true)
    try {
      const qs = new URLSearchParams()
      if (q.trim()) qs.set('query', q.trim())
      const data = await apiGet<EventCard[]>(`collections/${collectionId}/events?${qs.toString()}`)
      setEvents(data)
    } finally {
      setLoadingEvents(false)
    }
  }

  const fetchTimeline = async () => {
    if (!collectionId) return
    setLoadingTimeline(true)
    setError('')
    try {
      const payload = await apiGet<TimelineApiPayload>(`collections/${collectionId}/timeline`)
      const data = payload.data || ({ version: 1, items: [], options: { title: '', description: '' } } as TimelineData)
      setTimeline({
        version: 1,
        items: Array.isArray(data.items) ? data.items : [],
        options: data.options || { title: '', description: '' },
      })
      setSelectedItemId(null)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Erreur lors du chargement de la chronologie')
    } finally {
      setLoadingTimeline(false)
    }
  }

  useEffect(() => {
    if (!collectionId) return
    fetchEvents()
    fetchTimeline()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId])

  useEffect(() => {
    if (!collectionId) return
    fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const eventsById = useMemo(() => {
    const m = new Map<string, EventCard>()
    for (const ev of events) m.set(ev.id, ev)
    return m
  }, [events])

  const placedEventIds = useMemo(() => new Set(timeline.items.map(x => x.eventId)), [timeline.items])

  const computedRange = useMemo(() => {
    const all = timeline.items
      .map(it => eventsById.get(it.eventId))
      .filter(Boolean) as EventCard[]

    const dates = all.flatMap(ev => {
      const start = ev.startDate
      const end = ev.endDate || ev.startDate
      return [start, end]
    })

    if (!dates.length) {
      const t = todayISO()
      return { min: parseISODateToDayNumber(t) - 7, max: parseISODateToDayNumber(t) + 7 }
    }

    const nums = dates.map(parseISODateToDayNumber)
    const min = Math.min(...nums)
    const max = Math.max(...nums)

    const pad = Math.max(3, Math.floor((max - min) * 0.08))
    return { min: min - pad, max: max + pad }
  }, [timeline.items, eventsById])

  const selectedItem = useMemo(
    () => (selectedItemId ? timeline.items.find(x => x.id === selectedItemId) || null : null),
    [timeline.items, selectedItemId]
  )

  const scheduleAutoSave = () => {
    if (!collectionId) return
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      saveTimeline().catch(() => undefined)
    }, 700)
  }

  const getZoom = () => clamp(zoomPct / 100, 0.5, 2)

  const ensureCanvasDefaults = (item: TimelineItem, ev: EventCard | undefined, idx: number): TimelineItem => {
    // Time placement (X / width) is always derived from event dates: you can only move items on Y.
    // This keeps the chronological order stable (e.g. an event in 1556 cannot be moved into 1557).
    const fallbackLane = item.lane ?? 0
    const safeIndex = Number.isFinite(idx) ? idx : 0
    const startIso = ev?.startDate || todayISO()
    const endIso = ev?.endDate || ev?.startDate || startIso

    const s = parseISODateToDayNumber(startIso)
    const e = parseISODateToDayNumber(endIso)
    const left = (s - computedRange.min) / worldDays
    const width = Math.max(1 / worldDays, (e - s + 1) / worldDays)

    const CANVAS_W = 3200
    const CANVAS_H = 1800
    const CANVAS_MARGIN_X = 120
    const x = CANVAS_MARGIN_X + clamp(left, 0, 1) * (CANVAS_W - CANVAS_MARGIN_X * 2)
    const w = clamp(width, 0.06, 0.55) * (CANVAS_W - CANVAS_MARGIN_X * 2)

    const baseY = 140
    const y = typeof item.y === 'number' ? item.y : baseY + fallbackLane * 92 + (safeIndex % 3) * 8

    // Default height depends on display mode.
    const defaultH = item.displayMode === 'paragraph' ? 132 : 56

    return {
      ...item,
      x,
      y: clamp(y, 0, CANVAS_H - 40),
      w: item.w ?? Math.max(180, Math.min(720, w)),
      h: item.h ?? defaultH,
      displayMode: item.displayMode || 'header',
    }
  }

  const saveTimeline = async () => {
    if (!collectionId) return
    setSavingTimeline(true)
    setError('')
    try {
      await apiPut<TimelineApiPayload>(`collections/${collectionId}/timeline`, { data: timeline })
    } catch (e: any) {
      console.error(e)
      setError(e?.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSavingTimeline(false)
    }
  }

  const addEventToTimeline = (eventId: string) => {
    const ev = eventsById.get(eventId)
    if (!ev) return

    const id = (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2)
    const item: TimelineItem = {
      id,
      eventId,
      label: ev.name,
      color: pickDefaultColorFromTags(ev.tags),
      noteHtml: '',
      lane: 0,
      // default canvas position (will be refined on drop)
      x: undefined,
      y: undefined,
    }

    setTimeline(prev => {
      const merged = uniqBy([item, ...prev.items], x => x.id)
      return { ...prev, items: merged }
    })
    setSelectedItemId(id)
    scheduleAutoSave()
  }

  const removeItem = (id: string) => {
    setTimeline(prev => ({ ...prev, items: prev.items.filter(x => x.id !== id) }))
    if (selectedItemId === id) setSelectedItemId(null)
    scheduleAutoSave()
  }

  const removeEventFromTimeline = (eventId: string) => {
    setTimeline(prev => ({ ...prev, items: prev.items.filter(x => x.eventId !== eventId) }))
    if (selectedItemId) {
      const it = timeline.items.find(x => x.id === selectedItemId)
      if (it?.eventId === eventId) setSelectedItemId(null)
    }
    scheduleAutoSave()
  }

  const updateItem = (id: string, patch: Partial<TimelineItem>) => {
    setTimeline(prev => ({
      ...prev,
      items: prev.items.map(it => (it.id === id ? { ...it, ...patch } : it)),
    }))
    scheduleAutoSave()
  }

  const onDropToTimeline = (e: React.DragEvent) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain')
    if (!id) return
    if (placedEventIds.has(id)) return

    const viewport = canvasViewportRef.current
    const inner = canvasInnerRef.current
    if (!viewport || !inner) {
      addEventToTimeline(id)
      return
    }

    const rect = inner.getBoundingClientRect()
    const z = getZoom()

    // Coordinates in the unscaled canvas space
    const y = (e.clientY - rect.top) / z

    const ev = eventsById.get(id)
    const newId = (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2)
    const color = pickDefaultColorFromTags(ev?.tags)
    const placed: TimelineItem = {
      id: newId,
      eventId: id,
      label: ev?.name || 'Évènement',
      color: color ?? undefined,
      noteHtml: '',
      // X is derived from date; only Y is placed from the drop position.
      x: undefined,
      y: Math.max(0, y - 20),
      w: 260,
      h: 44,
      lane: 0,
      displayMode: 'header',
      paragraph: '',
    }

    setTimeline(prev => ({ ...prev, items: uniqBy([placed, ...prev.items], t => t.id) }))
    setSelectedItemId(newId)
    scheduleAutoSave()
  }

  const startDragItem = (e: React.PointerEvent, itemId: string) => {
    const it = timeline.items.find(x => x.id === itemId)
    if (!it) return

    const ev = eventsById.get(it.eventId)
    const normalized = ensureCanvasDefaults(it, ev, 0)
    if (normalized !== it) {
      // ensure coordinates exist before dragging
      setTimeline(prev => ({
        ...prev,
        items: prev.items.map(x => (x.id === itemId ? normalized : x)),
      }))
    }

    dragStateRef.current = {
      itemId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: normalized.x ?? 0,
      startY: normalized.y ?? 0,
    }

    dragMovedRef.current = false

    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const moveDragItem = (e: React.PointerEvent) => {
    const s = dragStateRef.current
    if (s) {
      const z = getZoom()
      const dy = (e.clientY - s.startClientY) / z

      if (Math.abs(dy) > 3) dragMovedRef.current = true

      updateItem(s.itemId, { y: Math.max(0, s.startY + dy) })
      return
    }

    const p = panStateRef.current
    if (!p) return
    const viewport = canvasViewportRef.current
    if (!viewport) return
    const dx = e.clientX - p.startClientX
    const dy = e.clientY - p.startClientY
    viewport.scrollLeft = p.startScrollLeft - dx
    viewport.scrollTop = p.startScrollTop - dy
  }

  const endDragItem = () => {
    const wasDraggingItem = dragStateRef.current
    const didMove = dragMovedRef.current

    if (dragStateRef.current) dragStateRef.current = null
    if (panStateRef.current) {
      panStateRef.current = null
      setIsPanning(false)
    }

    // Open modal on click (pointer down/up) but not after a drag.
    if (wasDraggingItem && !didMove) {
      setSelectedItemId(wasDraggingItem.itemId)
      setIsItemModalOpen(true)
    }
  }

  const createEvent = async () => {
    if (!collectionId) return
    try {
      const ev = await apiPost<any>(`collections/${collectionId}/events`, {
        name: 'Nouvel évènement',
        startDate: todayISO(),
        endDate: null,
        description: '',
        images: [],
        content: {},
      })
      setEditingEventId(ev.id)
      await fetchEvents()
    } catch (e) {
      console.error(e)
      alert('La création a échoué (voir console).')
    }
  }

  const worldDays = Math.max(1, computedRange.max - computedRange.min)

  const axisLabels = useMemo(() => {
    // 6 ticks max
    const ticks = 6
    const step = Math.max(1, Math.floor(worldDays / ticks))
    const labels: { leftPct: number; label: string }[] = []
    for (let i = 0; i <= ticks; i++) {
      const day = computedRange.min + i * step
      const d = new Date(day * 86400000)
      labels.push({ leftPct: (i * step) / worldDays, label: formatISO(d) })
    }
    return labels
  }, [computedRange.min, worldDays])

  const canvasItems = useMemo(() => {
    // Normalize items so old saved timelines still show in canvas.
    return timeline.items.map((it, idx) => {
      const ev = eventsById.get(it.eventId)
      return ensureCanvasDefaults(it, ev, idx)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline.items, eventsById, computedRange.min, computedRange.max, zoomPct])

  const CANVAS_W = 3400
  const CANVAS_H = 1800
  const BASE_GRID = 64
  const AXIS_H = 72

  const scaled = (n: number) => n * getZoom()

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-xl font-semibold">Chronologie</div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="text-sm text-gray-600">Collection</label>
          <select
            className="border rounded px-3 py-2"
            value={collectionId}
            onChange={e => setCollectionId(e.target.value)}
          >
            {collections.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button className="btn-secondary" onClick={fetchTimeline} disabled={!collectionId || loadingTimeline}>
            {loadingTimeline ? 'Chargement…' : 'Rafraîchir'}
          </button>
          <button className="btn-primary" onClick={saveTimeline} disabled={!collectionId || savingTimeline}>
            {savingTimeline ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>

          <button
            className="btn-secondary"
            type="button"
            onClick={() => setShowEventsList(v => !v)}
          >
            {showEventsList ? 'Masquer la liste' : 'Afficher la liste'}
          </button>

          {!showEventsList && (
            <button className="btn-primary" onClick={createEvent} disabled={!collectionId}>
              Créer évènement
            </button>
          )}
          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm text-gray-600">Zoom</span>
            <input
              type="range"
              min={60}
              max={160}
              step={5}
              value={zoomPct}
              onChange={e => setZoomPct(Number(e.target.value))}
            />
            <span className="text-sm text-gray-600 w-12 text-right">{zoomPct}%</span>
          </div>
        </div>
      </div>

      {error && <div className="border rounded-xl bg-red-50 text-red-700 px-4 py-3">{error}</div>}

      <div
        className={[
          'grid grid-cols-1 gap-6 min-w-0',
          showEventsList ? 'lg:grid-cols-[360px_1fr]' : 'lg:grid-cols-1',
        ].join(' ')}
      >
        {/* LEFT: Events list */}
        {showEventsList && (
        <aside className="rounded-xl border bg-white shadow-sm p-4 space-y-4 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-semibold">Évènements</div>
            <div className="ml-auto">
              <button className="btn-primary" onClick={createEvent} disabled={!collectionId}>
                Créer
              </button>
            </div>
          </div>

          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Rechercher…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />

          <div className="text-xs text-gray-500">
            Glissez un évènement sur la frise pour l’ajouter.
          </div>

          <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-1">
            {loadingEvents && <div className="text-sm text-gray-500">Chargement…</div>}

            {!loadingEvents && events.length === 0 && (
              <div className="text-sm text-gray-500">Aucun évènement.</div>
            )}

            {events.map(ev => {
              const alreadyPlaced = placedEventIds.has(ev.id)
              return (
                <div
                  key={ev.id}
                  draggable={!alreadyPlaced}
                  onDragStart={e => {
                    e.dataTransfer.setData('text/plain', ev.id)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  className={[
                    'border rounded-xl bg-white p-3 flex items-start gap-3',
                    alreadyPlaced ? 'opacity-60' : 'cursor-grab active:cursor-grabbing',
                  ].join(' ')}
                >
                  <img
                    src={ev.coverUrl || '/placeholder-event.svg'}
                    alt=""
                    className="w-10 h-10 rounded object-cover border"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <button
                        className="text-left font-medium text-gray-900 hover:underline min-w-0"
                        onClick={() => setViewingEventId(ev.id)}
                        type="button"
                      >
                        <span className="truncate block">{ev.name}</span>
                      </button>
                      {alreadyPlaced && <span className="text-[11px] text-gray-500">(déjà sur la frise)</span>}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {ev.endDate ? `${ev.startDate} → ${ev.endDate}` : ev.startDate}
                    </div>
                    <div className="flex gap-1 flex-wrap mt-2">
                      {(ev.tags || []).slice(0, 6).map(t => (
                        <span
                          key={t.id}
                          className="text-[11px] px-2 py-0.5 rounded border"
                          style={{
                            borderColor: t.color || '#e5e7eb',
                            backgroundColor: t.color ? `${t.color}22` : undefined,
                          }}
                          title={t.note || undefined}
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button className="btn-secondary" onClick={() => setEditingEventId(ev.id)}>
                      Éditer
                    </button>
                    {!alreadyPlaced && (
                      <button
                        className="btn-secondary"
                        onClick={() => addEventToTimeline(ev.id)}
                        disabled={!collectionId}
                      >
                        Ajouter
                      </button>
                    )}

                    {alreadyPlaced && (
                      <>
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            const it = timeline.items.find(x => x.eventId === ev.id)
                            if (it) setSelectedItemId(it.id)
                          }}
                        >
                          Voir
                        </button>
                        <button
                          className="btn-danger"
                          onClick={() => removeEventFromTimeline(ev.id)}
                        >
                          Retirer
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </aside>
        )}

        {/* RIGHT: Timeline */}
        <section className="space-y-4 min-w-0">
          <div className="rounded-xl border bg-white shadow-sm p-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                className="border rounded px-3 py-2"
                placeholder="Titre (optionnel)"
                value={timeline.options?.title || ''}
                onChange={e => {
                  setTimeline(prev => ({
                    ...prev,
                    options: { ...(prev.options || {}), title: e.target.value },
                  }))
                  scheduleAutoSave()
                }}
              />
              <input
                className="border rounded px-3 py-2"
                placeholder="Description courte (optionnelle)"
                value={timeline.options?.description || ''}
                onChange={e => {
                  setTimeline(prev => ({
                    ...prev,
                    options: { ...(prev.options || {}), description: e.target.value },
                  }))
                  scheduleAutoSave()
                }}
              />
            </div>

            <div
              className="border rounded-xl bg-gray-50 p-4"
              onDragOver={e => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDrop={onDropToTimeline}
            >
              <div className="text-sm font-semibold text-gray-800">Frise</div>
              <div className="text-xs text-gray-500">
                Déposez un évènement ici, puis déplacez-le librement sur le canvas.
              </div>

              <div
                ref={canvasViewportRef}
                className={[
                  'mt-4 rounded-xl border bg-white overflow-auto',
                  isPanning ? 'cursor-grabbing' : 'cursor-grab',
                ].join(' ')}
                style={{ height: '62vh', maxWidth: '100%' }}
              >
                <div
                  ref={canvasInnerRef}
                  className="relative"
                  style={{
                    width: scaled(CANVAS_W),
                    height: scaled(CANVAS_H),
                    backgroundImage:
                      'linear-gradient(to right, rgba(17,24,39,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,24,39,0.06) 1px, transparent 1px)',
                    backgroundSize: `${scaled(BASE_GRID)}px ${scaled(BASE_GRID)}px`,
                  }}
                  onPointerDown={e => {
                    // Pan only when clicking on empty canvas (not on cards).
                    if (e.button !== 0) return
                    if (e.target !== e.currentTarget) return
                    const viewport = canvasViewportRef.current
                    if (!viewport) return
                    panStateRef.current = {
                      pointerId: e.pointerId,
                      startClientX: e.clientX,
                      startClientY: e.clientY,
                      startScrollLeft: viewport.scrollLeft,
                      startScrollTop: viewport.scrollTop,
                    }
                    setIsPanning(true)
                    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                  }}
                  onPointerMove={moveDragItem}
                  onPointerUp={endDragItem}
                  onPointerCancel={endDragItem}
                >
                  {/* Sticky time axis */}
                  <div
                    className="sticky top-0 left-0 z-20"
                    style={{ height: scaled(AXIS_H) }}
                  >
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" />

                    <div
                      className="absolute left-0 right-0"
                      style={{ top: scaled(48), height: scaled(4) }}
                    >
                      <div className="h-full bg-gray-800 rounded" />
                    </div>

                    {axisLabels.map((t, idx) => {
                      const leftPxBase = clamp(t.leftPct, 0, 1) * 3200 + 120
                      return (
                        <div
                          key={idx}
                          className="absolute"
                          style={{ left: scaled(leftPxBase), top: scaled(18) }}
                        >
                          <div className="bg-gray-300" style={{ width: 1, height: scaled(16) }} />
                          <div className="text-[11px] text-gray-600 -translate-x-1/2 mt-1" style={{ transform: 'translateX(-50%)' }}>
                            {t.label}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {canvasItems.map(it => {
                    const ev = eventsById.get(it.eventId)
                    const color = it.color || pickDefaultColorFromTags(ev?.tags) || undefined
                    const isSelected = selectedItemId === it.id
                    const label = it.label || ev?.name || '(évènement introuvable)'
                    const mode = it.displayMode || 'header'

                    const customParagraph = (it.paragraph || '').trim()
                    const fallback = firstParagraphText(ev?.description || '')
                    const paragraphText = clampText(customParagraph || fallback, 500)
                    const year = getYearFromISO(ev?.startDate)

                    return (
                      <div
                        key={it.id}
                        className={[
                          'absolute rounded-xl border bg-white',
                          isSelected ? 'ring-2 ring-gray-900' : 'hover:shadow-sm',
                        ].join(' ')}
                        style={{
                          left: scaled(it.x ?? 0),
                          top: scaled(it.y ?? 0),
                          width: scaled(it.w ?? 260),
                          height: 'auto',
                          borderColor: color || '#e5e7eb',
                          backgroundColor: color ? `${color}14` : undefined,
                        }}
                      >
                        <button
                          type="button"
                          className={[
                            'w-full px-3 py-2 text-left text-sm rounded-xl select-none',
                          ].join(' ')}
                          title={it.noteHtml ? 'Annotation présente' : undefined}
                          onPointerDown={e => {
                            setSelectedItemId(it.id)
                            startDragItem(e, it.id)
                          }}
                        >
                          <div className="flex flex-col gap-2">
                            {/* Title */}
                            <div className="font-semibold text-gray-900 whitespace-normal break-words leading-snug">
                              {label}
                            </div>

                            {/* Meta row: year + date */}
                            <div className="flex items-center gap-2 min-w-0">
                              {typeof year === 'number' && (
                                <span className="text-[11px] text-gray-600 border rounded px-2 py-0.5">
                                  {year}
                                </span>
                              )}
                              <div className="ml-auto text-[11px] text-gray-500 whitespace-nowrap">
                                {ev?.endDate ? `${ev.startDate} → ${ev.endDate}` : (ev?.startDate || '')}
                              </div>
                            </div>

                            {/* Tags (always visible, including paragraph mode) */}
                            {(ev?.tags || []).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {(ev?.tags || []).slice(0, 6).map(t => (
                                  <span
                                    key={t.id}
                                    className="text-[11px] px-2 py-0.5 rounded border"
                                    style={{
                                      borderColor: t.color || '#e5e7eb',
                                      backgroundColor: t.color ? `${t.color}22` : undefined,
                                    }}
                                  >
                                    {t.name}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Paragraph */}
                            {mode === 'paragraph' && (
                              <div className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                                {paragraphText || '—'}
                              </div>
                            )}
                          </div>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {!timeline.items.length && (
                <div className="mt-4 text-sm text-gray-500">Aucun évènement sur la frise pour l’instant.</div>
              )}
            </div>
          </div>

        </section>
      </div>

      {/* EDIT TIMELINE ITEM MODAL */}
      {isItemModalOpen && selectedItem && (() => {
        const ev = eventsById.get(selectedItem.eventId)
        return (
          <div
            className="fixed inset-0 z-50"
            role="dialog"
            aria-modal="true"
            onMouseDown={e => {
              if (e.target === e.currentTarget) setIsItemModalOpen(false)
            }}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-3xl rounded-2xl border bg-white shadow-lg overflow-hidden">
                <div className="px-5 py-4 border-b flex items-start gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500">Édition</div>
                    <div className="font-semibold text-gray-900 break-words">{ev?.name || '(introuvable)'}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {ev ? (ev.endDate ? `${ev.startDate} → ${ev.endDate}` : ev.startDate) : ''}
                    </div>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button className="btn-danger" onClick={() => { removeItem(selectedItem.id); setIsItemModalOpen(false) }}>
                      Retirer
                    </button>
                    <button className="btn-secondary" onClick={() => setIsItemModalOpen(false)}>
                      Fermer
                    </button>
                  </div>
                </div>

                <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">Libellé</div>
                      <input
                        className="border rounded px-3 py-2 w-full"
                        value={selectedItem.label || ''}
                        onChange={e => updateItem(selectedItem.id, { label: e.target.value })}
                        placeholder={ev?.name || 'Libellé'}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">Couleur</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="border rounded h-10 w-14"
                          value={selectedItem.color || pickDefaultColorFromTags(ev?.tags) || '#111827'}
                          onChange={e => updateItem(selectedItem.id, { color: e.target.value })}
                        />
                        <button
                          className="btn-secondary"
                          onClick={() => updateItem(selectedItem.id, { color: undefined })}
                        >
                          Réinitialiser
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">Affichage sur la frise</div>
                      <select
                        className="border rounded px-3 py-2 w-full"
                        value={selectedItem.displayMode || 'header'}
                        onChange={e => updateItem(selectedItem.id, { displayMode: e.target.value as any })}
                      >
                        <option value="header">Entête</option>
                        <option value="paragraph">Paragraphe</option>
                      </select>
                      <div className="text-xs text-gray-500">
                        Entête: titre, date, tags. Paragraphe: extrait max 500 caractères.
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-700">Paragraphe personnalisé</div>
                      <textarea
                        className="border rounded px-3 py-2 w-full min-h-[96px]"
                        placeholder="Si vide: premier paragraphe de la description de l’évènement"
                        value={selectedItem.paragraph || ''}
                        onChange={e => updateItem(selectedItem.id, { paragraph: e.target.value })}
                        maxLength={1000}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-700">Annotation (richtext)</div>
                    <Editor
                      licenseKey="gpl"
                      tinymceScriptSrc="/tinymce/tinymce.min.js"
                      value={selectedItem.noteHtml || ''}
                      onEditorChange={html => updateItem(selectedItem.id, { noteHtml: html })}
                      init={{
                        base_url: '/tinymce',
                        suffix: '.min',
                        menubar: false,
                        height: 220,
                        browser_spellcheck: true,
                        contextmenu: false,
                        plugins: 'link lists table',
                        toolbar: 'bold italic | bullist numlist | link table',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* VIEW EVENT */}
      {viewingEventId && (
        <EventView
          eventId={viewingEventId}
          onClose={() => setViewingEventId(null)}
          onEdit={id => {
            setViewingEventId(null)
            setEditingEventId(id)
          }}
        />
      )}

      {/* EDIT EVENT */}
      {editingEventId && collectionId && (
        <EventsForm
          eventId={editingEventId}
          collectionId={collectionId}
          onClose={() => {
            setEditingEventId(null)
            fetchEvents()
          }}
        />
      )}
    </div>
  )
}
