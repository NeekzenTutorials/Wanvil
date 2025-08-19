import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Pencil, Check, X, FileDown } from 'lucide-react'
import { apiGet, apiPut, apiDelete, apiPost } from '../../utils/fetcher'
import type { SelectedNode } from '../../types/selectedNodes'
import ChapterEditor from '../Editor/ChapterEditor'
import { CharacterView } from '../characters/CharacterView'
import { ItemView } from '../items/ItemView'
import { PlaceView } from '../places/PlaceView'
import { EventView } from '../events/EventView'

interface NodeDetailsProps {
  selected: SelectedNode | null
  onRefreshHierarchy: () => void
}

type TomeDetail = {
  id: string
  name: string
  chapters: { id: string; title: string; position?: number }[]
}

export const NodeDetails = ({ selected, onRefreshHierarchy }: NodeDetailsProps) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)

  // État pour renommer un chapitre
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')

  const [viewingCharacterId, setViewingCharacterId] = useState<string|null>(null)
  const [viewingPlaceId, setViewingPlaceId] = useState<string|null>(null)
  const [viewingItemId, setViewingItemId] = useState<string|null>(null)
  const [viewingEventId, setViewingEventId] = useState<string|null>(null)

  useEffect(() => {
    if (!selected) return
    const { id, level } = selected
    setLoading(true)
    setSelectedChapterId(null)
    setIsEditingTitle(false)
    apiGet<any>(`${level}s/${id}`)
      .then((d) => {
        setData(d)
        setName(d.name)
        if (level === 'tome') {
          const chapters = (d.chapters || []) as TomeDetail['chapters']
          if (chapters.length) setSelectedChapterId(chapters[0].id)
        }
      })
      .finally(() => setLoading(false))
  }, [selected])

  useEffect(() => {
    const onOpen = (ev: any) => {
      const { type, id } = ev.detail as {type:'character'|'place'|'item'|'event'; id:string}
      if      (type === 'character') setViewingCharacterId(id)
      else if (type === 'place')     setViewingPlaceId(id)
      else if (type === 'item')      setViewingItemId(id)
      else if (type === 'event')     setViewingEventId(id)
    }
    window.addEventListener('wv:open-entity', onOpen as any)
    return () => window.removeEventListener('wv:open-entity', onOpen as any)
  }, [])

  const isTome = selected?.level === 'tome'
  const childrenKey = selected?.level === 'collection' ? 'sagas' : 'tomes'
  const children = (!isTome ? (data?.[childrenKey] ?? []) : []) as { id: string; name: string }[]

  const chapters = useMemo(() => (isTome ? (data?.chapters ?? []) : []), [isTome, data])
  const currentIndex = useMemo(
    () => (isTome && selectedChapterId ? chapters.findIndex((c: any) => c.id === selectedChapterId) : -1),
    [isTome, selectedChapterId, chapters]
  )

  const currentChapter = useMemo(
    () => (selectedChapterId ? chapters.find((c: any) => c.id === selectedChapterId) : null),
    [selectedChapterId, chapters]
  )

  // --------- Actions noeud (collection/saga/tome) --------------------------
  const saveNode = async () => {
    if (!selected) return
    await apiPut(`${selected.level}s/${selected.id}`, { name })
    onRefreshHierarchy()
  }

  const removeNode = async () => {
    if (!selected) return
    if (!confirm('Supprimer définitivement ?')) return
    await apiDelete(`${selected.level}s/${selected.id}`)
    onRefreshHierarchy()
  }

  const createChild = async () => {
    if (!selected) return
    const childName = prompt('Nom ?')?.trim()
    if (!childName) return
    let endpoint = ''
    if (selected.level === 'collection') endpoint = `collections/${selected.id}/sagas`
    else if (selected.level === 'saga') endpoint = `sagas/${selected.id}/tomes`
    await apiPost(endpoint, { name: childName })
    onRefreshHierarchy()
  }

  // --------- Actions chapitres --------------------------------------------
  const createChapter = async () => {
    const title = prompt('Titre du chapitre ?')?.trim() || 'Nouveau chapitre'
    if (!selected) return
    const newChap = await apiPost<{ id: string }>(`tomes/${selected.id}/chapters`, { title, content: '' })
    const fresh = await apiGet<TomeDetail>(`tomes/${selected.id}`)
    setData(fresh)
    setSelectedChapterId(newChap.id)
    setIsEditingTitle(false)
  }

  const deleteChapter = async () => {
    if (!selected || !selectedChapterId) return
    if (!confirm('Supprimer ce chapitre ?')) return
    await apiDelete(`chapters/${selectedChapterId}`)
    const fresh = await apiGet<TomeDetail>(`tomes/${selected.id}`)
    setData(fresh)
    if (fresh.chapters.length) {
      const next = fresh.chapters[Math.min(currentIndex, fresh.chapters.length - 1)]
      setSelectedChapterId(next.id)
    } else {
      setSelectedChapterId(null)
    }
    setIsEditingTitle(false)
  }

  const moveChapter = async (direction: 'up' | 'down') => {
    if (!selected || !selectedChapterId) return
    const idx = chapters.findIndex((c: any) => c.id === selectedChapterId)
    if (idx === -1) return
    const currentPos = idx + 1
    const targetPos = direction === 'up' ? currentPos - 1 : currentPos + 1
    if (targetPos < 1 || targetPos > chapters.length) return
    const updated = await apiPut<{ id:string; title:string; position:number }[]>(
      `chapters/${selectedChapterId}/move`,
      { toPosition: targetPos }
    )
    setData((prev: any) => ({ ...prev, chapters: updated }))
  }

  const beginEditTitle = () => {
    if (!currentChapter) return
    setDraftTitle(currentChapter.title)
    setIsEditingTitle(true)
  }

  const cancelEditTitle = () => {
    setIsEditingTitle(false)
    setDraftTitle('')
  }

  const saveChapterTitle = async () => {
    if (!selectedChapterId) return
    const title = draftTitle.trim()
    if (!title) return
    await apiPut(`chapters/${selectedChapterId}`, { title })
    // met à jour la liste locale
    setData((prev: any) => ({
      ...prev,
      chapters: (prev.chapters || []).map((c: any) => (c.id === selectedChapterId ? { ...c, title } : c)),
    }))
    setIsEditingTitle(false)
  }

  const exportPdf = async () => {
    if (!selected || selected.level !== 'tome') return
    const res = await fetch(`/api/tomes/${selected.id}/export/pdf`, { credentials: 'include', headers: { Accept: 'application/pdf' } })
    if (!res.ok) { alert('Export PDF échoué'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name || 'tome'}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  if (!selected) return null
  if (loading || !data) return <p>Chargement…</p>

  return (
    <div className="space-y-6">
      {/* --- En-tête du nœud (nom + actions globales) ---------------------- */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full sm:max-w-md"
            placeholder={isTome ? 'Nom du tome' : 'Nom'}
          />
          <div className="flex gap-2 sm:ml-auto">
            <button onClick={saveNode} className="btn-primary">Enregistrer</button>
            {isTome && (
              <button onClick={exportPdf} className="btn-secondary inline-flex items-center gap-2">
                <FileDown className="w-4 h-4" /> Exporter PDF
              </button>
            )}
            <button onClick={removeNode} className="btn-danger">Supprimer</button>
          </div>
        </div>
      </div>

      {/* --- Zone Tome : barre chapitres + éditeur ------------------------- */}
      {isTome && (
        <section className="rounded-2xl border bg-white shadow-sm">
          {/* Barre chapitres (sticky) */}
          <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => currentIndex > 0 && setSelectedChapterId(chapters[currentIndex - 1].id)}
                      className="btn-muted" disabled={currentIndex <= 0}>
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                className="border rounded-lg px-2 py-2 min-w-[220px] flex-1"
                value={selectedChapterId ?? ''}
                onChange={(e) => { setSelectedChapterId(e.target.value); setIsEditingTitle(false) }}
              >
                {chapters.map((c: any, i: number) => (
                  <option key={c.id} value={c.id}>
                    {`Chapitre ${i + 1} — ${c.title}`}
                  </option>
                ))}
              </select>

              <button onClick={() => currentIndex >= 0 && currentIndex < chapters.length - 1 && setSelectedChapterId(chapters[currentIndex + 1].id)}
                      className="btn-muted" disabled={currentIndex < 0 || currentIndex >= chapters.length - 1}>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1" />

              {/* Titre courant + édition inline */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                {!isEditingTitle ? (
                  <>
                    <div className="truncate text-sm sm:text-base font-medium text-gray-900">
                      {currentIndex >= 0 ? `Chapitre ${currentIndex + 1} — ${currentChapter?.title ?? ''}` : 'Aucun chapitre'}
                    </div>
                    {!!currentChapter && (
                      <button onClick={beginEditTitle} className="btn-muted" title="Renommer">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      autoFocus
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      className="border rounded-lg px-2 py-1 w-full"
                      placeholder="Titre du chapitre"
                    />
                    <button onClick={saveChapterTitle} className="btn-primary p-2" title="Valider">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={cancelEditTitle} className="btn-muted p-2" title="Annuler">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-gray-200 mx-1" />

              {/* Réordonner / Créer / Supprimer */}
              <div className="flex items-center gap-2">
                <button onClick={() => moveChapter('up')} className="btn-muted" disabled={currentIndex <= 0}>
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => moveChapter('down')} className="btn-muted" disabled={currentIndex < 0 || currentIndex >= chapters.length - 1}>
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button onClick={createChapter} className="btn-secondary inline-flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Nouveau
                </button>
                <button onClick={deleteChapter} className="btn-danger inline-flex items-center gap-1" disabled={!selectedChapterId}>
                  <Trash2 className="w-4 h-4" /> Supprimer
                </button>
              </div>
            </div>
          </div>

          {/* Éditeur */}
          <div className="p-4 sm:p-6">
            {selectedChapterId ? (
              <ChapterEditor
                chapterId={selectedChapterId}
                onSaved={() => {/* tu peux afficher un toast si besoin */}}
              />
            ) : (
              <p className="text-sm text-gray-500">Aucun chapitre. Créez-en un pour commencer.</p>
            )}
          </div>
        </section>
      )}

      {/* --- Enfants pour Collection/Saga ---------------------------------- */}
      {!isTome && (
        <section className="rounded-2xl border bg-white shadow-sm p-4 sm:p-5">
          <h3 className="font-semibold mb-2">
            {selected.level === 'collection' ? 'Sagas' : 'Tomes'}
          </h3>

          {children.length ? (
            <ul className="list-disc ml-5 space-y-1 text-gray-800">
              {children.map((c) => <li key={c.id}>{c.name}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              Aucun {(childrenKey as string).slice(0, -1)}
            </p>
          )}

          {selected.level !== 'tome' && (
            <button onClick={createChild} className="text-indigo-600 flex items-center gap-1 mt-4 text-sm">
              <Plus className="w-4 h-4" /> Nouveau
            </button>
          )}
        </section>
      )}
      {/* Vues descriptives déclenchées depuis l’éditeur */}
      {viewingCharacterId && (
        <CharacterView
          characterId={viewingCharacterId}
          onClose={() => setViewingCharacterId(null)}
          onEdit={(id) => { setViewingCharacterId(null); /* si tu veux ouvrir l’éditeur natif ici */ }}
        />
      )}
      {viewingPlaceId && (
        <PlaceView
          placeId={viewingPlaceId}
          onClose={() => setViewingPlaceId(null)}
          onEdit={undefined}
        />
      )}
      {viewingItemId && (
        <ItemView
          itemId={viewingItemId}
          onClose={() => setViewingItemId(null)}
          onEdit={undefined}
        />
      )}
      {viewingEventId && (
        <EventView
          eventId={viewingEventId}
          onClose={() => setViewingEventId(null)}
          onEdit={undefined}
        />
      )}
    </div>
  )
}
