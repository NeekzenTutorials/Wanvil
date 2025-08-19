// src/components/places/PlacesPage.tsx
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { apiGet, apiPost, apiDelete } from '../../utils/fetcher'
import { Plus, Trash2, MapPin, Edit3 } from 'lucide-react'
import TagFilterPopover from '../common/TagFilterPopover'
import { PlacesForm } from './PlacesForm'
import { PlaceView } from './PlaceView'

type Collection = { id: string; name: string }
type Tag = { id: string; name: string; color?: string; note?: string }

type Card = {
  id: string
  name: string
  location?: string | null
  coverUrl?: string | null
  tags: Tag[]
}

export function PlacesPage({ projectId }: { projectId: string }) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionId, setCollectionId] = useState<string | null>(null)

  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [cards, setCards] = useState<Card[]>([])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [matchMode, setMatchMode] = useState<'any'|'all'>('any')

  // Regroupement par annotation de tag (ex: "région")
  const noteOptions = useMemo(
    () => Array.from(new Set(tags.map(t => t.note).filter(Boolean))) as string[],
    [tags]
  )
  const [groupNote, setGroupNote] = useState<string>('')

  useEffect(() => {
    apiGet<Collection[]>(`projects/${projectId}/collections`).then((cols) => {
        setCollections(cols)
        if (cols.length && !collectionId) setCollectionId(cols[0].id)
    })
  }, [projectId])

  useEffect(() => {
    if (!collectionId) return
    apiGet<Tag[]>(`collections/${collectionId}/tags?scope=place`).then(setTags)
    fetchPlaces()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId, selectedTagIds, q, matchMode])

  const fetchPlaces = async () => {
    if (!collectionId) return
    const qs = new URLSearchParams()
    if (selectedTagIds.length) qs.set('tags', selectedTagIds.join(','))
    if (q.trim()) qs.set('query', q.trim())
    qs.set('match', matchMode)
    const data = await apiGet<Card[]>(`collections/${collectionId}/places?${qs.toString()}`)
    setCards(data)
  }

  const createPlace = async () => {
    if (!collectionId) { alert('Choisissez une collection'); return }
    try {
    const p = await apiPost<any>(`collections/${collectionId}/places`, {
        name: 'Nouveau lieu',
        location: '',
        description: '',
        images: [],
        content: { customFields: [] }
    })
    setEditingId(p.id)
    fetchPlaces()
    } catch (e) {
    console.error(e)
    alert('La création du lieu a échoué (voir console).')
    }
  }

  const deletePlace = async (id: string) => {
    const card = cards.find(c => c.id === id)
    const label = card ? `${card.name}` : 'ce lieu'
    if (!confirm(`Supprimer définitivement ${label} ?`)) return

    setDeletingId(id)
    try {
      await apiDelete(`places/${id}`)
      if (editingId === id) setEditingId(null)
      await fetchPlaces()
    } finally {
      setDeletingId(null)
    }
  }

  function renderCard(card: Card): ReactNode {
    return (
      <article
        key={card.id}
        className="relative group border rounded-xl bg-white p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md transition"
        onClick={() => setViewingId(card.id)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); deletePlace(card.id) }}
          disabled={deletingId === card.id}
          title="Supprimer ce lieu"
          aria-label="Supprimer ce lieu"
          className="absolute top-2 right-2 p-1.5 rounded-full border text-red-600 bg-white/95 hover:bg-red-50 hover:border-red-300 shadow-sm transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 disabled:opacity-50"
        >
          {deletingId === card.id ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a 8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
            </svg>
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setEditingId(card.id) }}
          title="Éditer ce lieu"
          aria-label="Éditer ce lieu"
          className="absolute top-2 right-10 p-1.5 rounded-full border bg-white/95 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <Edit3 className="w-4 h-4" />
        </button>

        <img
          src={card.coverUrl || '/placeholder-location.svg'}
          className="w-12 h-12 rounded object-cover"
          alt=""
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{card.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3" /> {card.location || '—'}
          </div>
          <div className="flex gap-1 flex-wrap mt-1">
            {(card.tags || []).map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2 py-0.5 rounded border"
                style={{ borderColor: tag.color || '#e5e7eb', backgroundColor: tag.color ? tag.color + '22' : undefined }}
                title={tag.note || undefined}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </article>
    )
  }

  // --- regroupements par annotation
  const tagsForCurrentNote = useMemo(
    () => (groupNote ? tags.filter(t => (t.note || '') === groupNote) : []),
    [tags, groupNote]
  )
  const cardsWithoutCurrentNote = useMemo(() => {
    if (!groupNote) return []
    const ids = new Set(tagsForCurrentNote.map(t => t.id))
    return cards.filter(c => !((c.tags || []).some((x: any) => ids.has(x.id))))
  }, [cards, tagsForCurrentNote, groupNote])

  const sectionsForCurrentNote = useMemo(() => {
    if (!groupNote) return []
    return tagsForCurrentNote
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(tag => ({ tag, cards: cards.filter(c => (c.tags || []).some((x: any) => x.id === tag.id)) }))
      .filter(sec => sec.cards.length > 0)
  }, [cards, tagsForCurrentNote, groupNote])

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border rounded px-3 py-2"
          value={collectionId ?? ''}
          onChange={e => setCollectionId(e.target.value || null)}
        >
          <option value="" disabled>Choisir une collection</option>
          {collections.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
        </select>

        <input
          className="border rounded px-3 py-2 flex-1 min-w-[200px]"
          placeholder="Rechercher…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />

        <TagFilterPopover
          tags={tags}
          noteOptions={noteOptions}
          selectedTagIds={selectedTagIds}
          onChange={setSelectedTagIds}
        />

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Correspondance</label>
          <select
            className="border rounded px-2 py-2"
            value={matchMode}
            onChange={e => setMatchMode(e.target.value as 'any'|'all')}
          >
            <option value="any">Au moins un</option>
            <option value="all">Tous</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <label className="text-sm text-gray-700">Regrouper par annotation</label>
          <select
            className="border rounded px-2 py-2"
            value={groupNote}
            onChange={e => setGroupNote(e.target.value)}
          >
            <option value="">Aucune</option>
            {noteOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>

          <button onClick={createPlace} className="btn-primary inline-flex items-center gap-1">
            <Plus className="w-4 h-4" /> Nouveau lieu
          </button>
        </div>
      </div>

      {/* Contenu */}
      {groupNote === '' ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(renderCard)}
        </div>
      ) : (
        <div className="space-y-10">
          {cardsWithoutCurrentNote.length > 0 && (
            <section>
              <header className="mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Sans {groupNote}
                  <span className="ml-2 text-gray-400">({cardsWithoutCurrentNote.length})</span>
                </h3>
              </header>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {cardsWithoutCurrentNote.map(renderCard)}
              </div>
            </section>
          )}

          {sectionsForCurrentNote.length === 0 && (
            <p className="text-sm text-gray-500">Aucun tag avec l’annotation « {groupNote} ».</p>
          )}

          {sectionsForCurrentNote.map(({ tag, cards: arr }) => (
            <section key={tag.id}>
              <header className="mb-3 flex items-center gap-2">
                <div className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || '#e5e7eb' }} />
                <h3 className="text-sm font-semibold" style={{ color: tag.color || undefined }}>{tag.name}</h3>
                <span className="text-xs text-gray-400">({arr.length})</span>
              </header>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {arr.map(renderCard)}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* VIEW */}
      {viewingId && (
        <PlaceView
          placeId={viewingId}
          onClose={() => setViewingId(null)}
          onEdit={(id) => { setViewingId(null); setEditingId(id) }}
        />
      )}
      {/* EDIT */}
      {editingId && (
        <PlacesForm
          placeId={editingId}
          collectionId={collectionId!}
          onClose={() => { setEditingId(null); fetchPlaces() }}
      />
      )}
    </div>
  )
}