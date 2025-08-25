// src/components/Editor/ChapterEditor.tsx
import { useEffect, useRef, useState, useMemo } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { apiGet, apiPut } from '../../utils/fetcher'
import AutocompletePopover, { type AcItem } from '../common/AutoCompletePopover'

type Chapter = { id: string; title: string; content: string; position?: number }

interface ChapterEditorProps {
  chapterId: string
  onSaved?: () => void
  collectionId?: string
}

type Suggestion = { id: string; type: 'character'|'place'|'item'|'event'; label: string; hint?: string | null }

export default function ChapterEditor({ chapterId, onSaved, collectionId: collectionIdProp }: ChapterEditorProps) {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'edit'|'render'>('edit')
  const viewModeRef = useRef<'edit'|'render'>('edit')
  const [notes, setNotes] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTab, setPanelTab] = useState<'notes'|'analytics'>('notes')
  const [annotations, setAnnotations] = useState<Record<string, AnnotationData>>({})
  const annotationsRef = useRef(annotations)
  useEffect(() => { annotationsRef.current = annotations }, [annotations])
  const [annOpen, setAnnOpen] = useState(false)
  const [annMode, setAnnMode] = useState<'create'|'edit'>('create')
  const [annDraft, setAnnDraft] = useState<{ id:string; note:string; entity?:LinkedEntity; selection?: Range | null }>({ id:'', note:'', entity:undefined, selection:null })

  // ---- collectionId (avec ref pour TinyMCE closures)
  const [collectionId, setCollectionId] = useState<string | null>(collectionIdProp ?? null)
  const collectionIdRef = useRef<string | null>(collectionIdProp ?? null)
  useEffect(() => { collectionIdRef.current = collectionIdProp ?? collectionId }, [collectionIdProp, collectionId])

  // ---------- ANALYTICS (comptage d’entités) ------------------------------
  type EntityType = 'character'|'place'|'item'|'event'
  type EntityCount = { id:string; type:EntityType; label:string; count:number }
  type LinkedEntity = { type:EntityType; id:string; label:string }
  type AnnotationData = { id:string; note:string; entity?: LinkedEntity }

  const makeAnnId = () => 'ann_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8)

  function truncateForTitle(s:string, n=120){
    const t = (s||'').replace(/\s+/g,' ').trim()
    return t.length <= n ? t : t.slice(0, n-1) + '…'
  }
  const analytics: EntityCount[] = useMemo(() => {
    try {
      // On parse le HTML du chapitre et on compte les <span.wv-entity ...>
      const doc = new DOMParser().parseFromString(`<div>${content || ''}</div>`, 'text/html')
      const spans = Array.from(doc.querySelectorAll('span.wv-entity')) as HTMLElement[]
      const map = new Map<string, EntityCount>()
      for (const el of spans) {
        const type = (el.getAttribute('data-entity-type') || '') as EntityType
        const id   = el.getAttribute('data-entity-id') || ''
        if (!type || !id) continue
        const key = `${type}:${id}`
        const label = (el.textContent || '').trim()
        const curr = map.get(key)
        map.set(key, { id, type, label, count: (curr?.count || 0) + 1 })
      }
      return Array.from(map.values()).sort((a,b) => b.count - a.count || a.label.localeCompare(b.label))
    } catch { return [] }
  }, [content])

  function EntityAttach({
    value,
    onChange,
    collectionIdRef
  }:{ value?: LinkedEntity; onChange:(v:LinkedEntity|null)=>void; collectionIdRef: React.MutableRefObject<string|null> }) {
    const [type, setType] = useState<EntityType>(value?.type || 'character')
    const [q, setQ] = useState(value?.label || '')
    const [results, setResults] = useState<Suggestion[]>([])
    const [loading, setLoading] = useState(false)
  
    useEffect(()=>{
      setType(value?.type || 'character')
      setQ(value?.label || '')
    }, [value?.id])
  
    useEffect(()=>{
      const collId = collectionIdRef.current
      const run = async () => {
        if (!collId || (q || '').trim().length < 2) { setResults([]); return }
        setLoading(true)
        try {
          const rows: Suggestion[] = await apiGet(`collections/${collId}/autocomplete?q=${encodeURIComponent(q)}&limit=8`)
          setResults(rows.filter(r => r.type === type))
        } catch { setResults([]) }
        finally { setLoading(false) }
      }
      const t = setTimeout(run, 180)
      return ()=> clearTimeout(t)
    }, [q, type])
  
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <select className="border rounded px-2 py-1 text-sm" value={type} onChange={e=>setType(e.target.value as EntityType)}>
            <option value="character">Personnage</option>
            <option value="place">Lieu</option>
            <option value="item">Objet</option>
            <option value="event">Évènement</option>
          </select>
          <input
            className="flex-1 border rounded px-3 py-1.5 text-sm"
            placeholder="Rechercher…"
            value={q}
            onChange={e=>setQ(e.target.value)}
          />
          {value ? (
            <button className="btn-muted" onClick={()=>onChange(null)}>Retirer</button>
          ) : null}
        </div>
  
        <div className="max-h-40 overflow-auto border rounded">
          {loading ? (
            <div className="p-2 text-sm text-gray-500">Recherche…</div>
          ) : results.length ? (
            <ul className="divide-y">
              {results.map(r => (
                <li key={r.type + r.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                    onClick={()=> onChange({ type:r.type, id:r.id, label:r.label })}
                  >
                    <div className="font-medium">{r.label}</div>
                    {r.hint ? <div className="text-xs text-gray-500">{r.hint}</div> : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-2 text-sm text-gray-500">Aucun résultat</div>
          )}
        </div>
      </div>
    )
  }

  // ---- charge contenu
  useEffect(() => {
    setLoading(true)
    apiGet<Chapter>(`chapters/${chapterId}`)
      .then((c) => {
        setContent(c.content || '')
        const fromApiNotes   = (c as any).notes
        const fromLocalNotes = localStorage.getItem(`chapter:${chapterId}:notes`) || ''
        setNotes(typeof fromApiNotes === 'string' ? fromApiNotes : fromLocalNotes)
      
        // NEW: annotations
        const fromApiAnn   = (c as any).annotations as AnnotationData[] | undefined
        const fromLocalAnn = JSON.parse(localStorage.getItem(`chapter:${chapterId}:annotations`) || '[]') as AnnotationData[]
        const list = Array.isArray(fromApiAnn) ? fromApiAnn : fromLocalAnn
        const map: Record<string, AnnotationData> = {}
        for (const a of list) map[a.id] = a
        setAnnotations(map)
      })
      .finally(() => setLoading(false))
  }, [chapterId])

  useEffect(() => {
    viewModeRef.current = viewMode
    const ed = editorRef.current
    if (!ed) return
    const body = ed.getBody?.()
    if (!body) return
    if (viewMode === 'edit') {
      body.classList.add('wv-mode-edit')
      body.classList.remove('wv-mode-render')
    } else {
      body.classList.add('wv-mode-render')
      body.classList.remove('wv-mode-edit')
    }
    // notifier les boutons TinyMCE pour mettre à jour leur état actif
    try { ed.fire('wv:mode'); } catch {}
  }, [viewMode])

  // ---- récup collection si absente
  useEffect(() => {
    if (collectionIdProp) return
    ;(async () => {
      try {
        const data = await apiGet<{ collectionId: string }>(`chapters/${chapterId}/collection`)
        setCollectionId(data.collectionId)
      } catch { setCollectionId(null) }
    })()
  }, [chapterId, collectionIdProp])

  // Sauvegarde (notes incluses) + fallback localStorage
  const save = async () => {
    setSaving(true)
    try {
      await apiPut(`chapters/${chapterId}`, { content, notes, annotations: Object.values(annotationsRef.current) }) // le backend peut ignorer "notes" si non pris en charge
      localStorage.setItem(`chapter:${chapterId}:notes`, notes || '')
      localStorage.setItem(`chapter:${chapterId}:annotations`, JSON.stringify(Object.values(annotationsRef.current)))
      onSaved?.()
    } finally { setSaving(false) }
  }

  const jumpToEntity = (e: EntityCount) => {
    const ed = editorRef.current
    if (!ed) return
    try {
      const body = ed.getBody()
      const el = body?.querySelector(`span.wv-entity[data-entity-type="${e.type}"][data-entity-id="${e.id}"]`) as HTMLElement|null
      if (el) {
        ed.selection.select(el)
        ed.selection.scrollIntoView(el, true)
        ed.focus()
      }
    } catch {}
  }

  // Ouvrir la view descriptive depuis l’analyse
  const openEntityView = (e: EntityCount) => {
    window.dispatchEvent(new CustomEvent('wv:open-entity', { detail: { type: e.type, id: e.id } }))
  }

  // ---------- AUTOCOMPLETE state (externe) ---------------------------------
  const [acItems, setAcItems] = useState<AcItem[]>([])
  const [acIndex, setAcIndex] = useState(0)
  const acItemsRef = useRef<AcItem[]>([])
  const acIndexRef = useRef(0)
  useEffect(() => {
    acItemsRef.current = acItems
  }, [acItems])
  useEffect(() => { acIndexRef.current = acIndex }, [acIndex])
  const [acAnchor, setAcAnchor] = useState<{x:number; y:number} | null>(null)
  const [edRef, setEdRef] = useState<any>(null)
  const acceptRef = useRef(false)
  const editorRef = useRef<any>(null);

  // petite util pour “debouncer” les appels réseau
  const debounceRef = useRef<number | null>(null)
  const debounce = (fn: () => void, ms = 150) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(fn, ms)
  }

  // mot courant au caret
  const getCurrentWord = (ed: any): { word: string; rng: Range | null } => {
    const rng: Range = ed.selection.getRng()
    if (!rng) return { word: '', rng: null }
  
    let container: Node = rng.startContainer
    if (container.nodeType !== Node.TEXT_NODE) {
      if (container.childNodes && container.childNodes.length && rng.startOffset > 0) {
        const cand = container.childNodes[Math.min(rng.startOffset - 1, container.childNodes.length - 1)]
        if (cand && cand.nodeType === Node.TEXT_NODE) container = cand
        else return { word:'', rng: null }
      } else {
        return { word:'', rng: null }
      }
    }
  
    const text = (container as Text).data || ''
    const caret = rng.startOffset
    const left = text.slice(0, caret)
    const m = left.match(/([\p{L}\p{N}_]{1,})$/u)
    const start = m ? (caret - m[1].length) : caret
  
    const right = text.slice(caret)
    const m2 = right.match(/^([\p{L}\p{N}_]{0,})/u)
    const end = caret + (m2 ? m2[1].length : 0)
  
    const word = text.slice(start, end)
  
    // ⚠️ créer le range dans le document TinyMCE (iframe), pas dans window.document
    const doc: Document = ed.getDoc?.() || (container as any)?.ownerDocument || document
    const wr = doc.createRange()
    wr.setStart(container, start)
    wr.setEnd(container, end)
  
    return { word, rng: wr }
  }

  const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string))

  // calcule la position “page” du caret pour ancrer le popover
  const computeAnchor = (ed:any): {x:number;y:number} | null => {
    try {
      const rng: Range = ed.selection.getRng()
      const rect = (rng.getClientRects()[0] || rng.getBoundingClientRect())
      if (!rect) return null
      // éditeur en iframe -> additionner la position de l’iframe
      const iframe = ed.getContentAreaContainer()?.querySelector?.('iframe') as HTMLIFrameElement | null
      if (iframe) {
        const ifr = iframe.getBoundingClientRect()
        return { x: ifr.left + rect.left, y: ifr.top + rect.bottom + 6 }
      }
      // mode inline
      const root = ed.getBody()
      const rootRect = root?.getBoundingClientRect?.()
      if (rootRect) return { x: rootRect.left + rect.left, y: rootRect.top + rect.bottom + 6 }
      return { x: rect.left, y: rect.bottom + 6 }
    } catch { return null }
  }

  // insertion d’une suggestion
  const closeAC = () => {
    setAcItems([])
    setAcAnchor(null)
    setAcIndex(0)
  }

  // insertion d’une suggestion
  const pick = (s: Suggestion) => {
    const ed = editorRef.current
    if (!ed) return
    try { ed.focus(false) } catch {}
  
    const { rng } = getCurrentWord(ed)
    const html = `<span data-entity-type="${s.type}" data-entity-id="${s.id}" class="wv-entity" title="Ctrl/Cmd + clic pour ouvrir">${escapeHtml(s.label)}</span>`
  
    ed.undoManager.transact(() => {
      if (rng) ed.selection.setRng(rng)
      ed.insertContent(html)
      ed.selection.collapse(false)
    })
  
    setTimeout(() => { acceptRef.current = false; closeAC() }, 0)
  }

  const wrapSelectionWithAnnotation = (rng: Range, ann: AnnotationData) => {
    const ed = editorRef.current
    if (!ed) return
    ed.undoManager.transact(() => {
      ed.selection.setRng(rng)
      // évite les sélections vides
      if (!ed.selection.getContent({format:'text'}).trim()) return
  
      const attrs = [
        `class="wv-annotation"`,
        `data-ann-id="${ann.id}"`,
        ann.entity ? `data-ann-entity-type="${ann.entity.type}"` : '',
        ann.entity ? `data-ann-entity-id="${ann.entity.id}"` : '',
        ann.note ? `title="${escapeHtml(truncateForTitle(ann.note))}"` : ''
      ].filter(Boolean).join(' ')
  
      ed.selection.setContent(`<span ${attrs}>${ed.selection.getContent({format:'html'})}</span>`)
    })
  }
  
  const updateAnnotationDom = (ann: AnnotationData) => {
    const ed = editorRef.current
    if (!ed) return
    const body = ed.getBody()
    const el = body?.querySelector(`span.wv-annotation[data-ann-id="${ann.id}"]`) as HTMLElement | null
    if (!el) return
    if (ann.entity) {
      el.setAttribute('data-ann-entity-type', ann.entity.type)
      el.setAttribute('data-ann-entity-id', ann.entity.id)
    } else {
      el.removeAttribute('data-ann-entity-type')
      el.removeAttribute('data-ann-entity-id')
    }
    el.setAttribute('title', truncateForTitle(ann.note || ''))
  }  

  return (
    <div className="space-y-3">
      {/* barre locale du chapitre */}
      <div className="flex items-center gap-2 justify-between">
        <div className="text-sm text-gray-500">Mode : {viewMode === 'edit' ? 'Édition' : 'Rendu'}</div>
        <button
          type="button"
          onClick={() => setPanelOpen(v => !v)}
          className="btn-secondary"
          aria-expanded={panelOpen}
        >
          {panelOpen ? 'Masquer Notes & Analyse' : 'Afficher Notes & Analyse'}
        </button>
      </div>

      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"   
        value={content}
        onEditorChange={(v) => setContent(v)}
        onInit={(_, editor) => { editorRef.current = editor }}  // garder une réf de l’instance
        init={{
          base_url: '/tinymce',
          suffix: '.min',
          height: 600,
          menubar: false,
          branding: false,
          toolbar_mode: 'sliding',
          extended_valid_elements: 'span[data-entity-type|data-entity-id|class|title]',
          content_style: `
            .wv-entity{
              padding:1px 4px; border-radius:4px; cursor:pointer;
              text-decoration:none; transition:filter .15s ease;
            }
              .wv-annotation{
              border-bottom: 2px dotted transparent;
              cursor: pointer;
              transition: filter .15s ease;
            }
            .wv-mode-edit .wv-entity:hover{ filter:brightness(0.95); }
            /* couleurs visibles UNIQUEMENT en mode édition */
            .wv-mode-edit .wv-entity[data-entity-type="character"]{ background:#e0f2fe; color:#075985; }
            .wv-mode-edit .wv-entity[data-entity-type="place"]{     background:#dcfce7; color:#166534; }
            .wv-mode-edit .wv-entity[data-entity-type="item"]{      background:#fef3c7; color:#92400e; }
            .wv-mode-edit .wv-entity[data-entity-type="event"]{     background:#ede9fe; color:#5b21b6; }
            .wv-mode-edit .wv-entity::after{
              content:" ⌃click"; font-size:.7em; opacity:.4; margin-left:.25em;
            }
            .wv-mode-edit .wv-annotation{ background:#f1f5f9; border-color:#94a3b8; }
            .wv-mode-edit .wv-annotation[data-ann-entity-type="character"]{ background:#ffe4e6; border-color:#fb7185; }
            .wv-mode-edit .wv-annotation[data-ann-entity-type="place"]{     background:#dcfce7; border-color:#34d399; }
            .wv-mode-edit .wv-annotation[data-ann-entity-type="item"]{      background:#fef3c7; border-color:#f59e0b; }
            .wv-mode-edit .wv-annotation[data-ann-entity-type="event"]{     background:#ede9fe; border-color:#8b5cf6; }
            .wv-mode-edit .wv-annotation:hover{ filter:brightness(0.97); }

            /* Mode rendu : neutre */
            .wv-mode-render .wv-entity{ background:none !important; color:inherit !important; padding:0; }
            .wv-mode-render .wv-annotation{ background:none !important; border-color:transparent !important; }
            .wv-mode-render .wv-entity::after{ display:none; }
          `,
          plugins: 'lists link image table code help wordcount fullscreen searchreplace visualblocks pagebreak',
          toolbar:
            'undo redo | blocks | bold italic underline strikethrough | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | link image table pagebreak | ' +
            'removeformat | fullscreen | code | wvEditMode wvRenderMode' + ' | wvAnnotate',
            setup: (ed:any) => {
              ed.on('blur', closeAC)

              ed.on('init', () => {
                try {
                  const body = ed.getBody?.()
                  if (!body) return
                  if (viewModeRef.current === 'edit') body.classList.add('wv-mode-edit')
                  else body.classList.add('wv-mode-render')
                } catch {}
              })
  
              // Boutons "Édition" et "Rendu"
              ed.ui.registry.addToggleButton('wvEditMode', {
                text: 'Édition',
                tooltip: 'Afficher les couleurs et le hint ⌃click',
                onAction: () => setViewMode('edit'),
                onSetup: (api: { setActive: (state: boolean) => void }) => {
                  api.setActive(viewModeRef.current === 'edit')
                  const fn = () => api.setActive(viewModeRef.current === 'edit')
                  ed.on('wv:mode', fn)
                  return () => ed.off('wv:mode', fn)
                }
              })

              ed.ui.registry.addToggleButton('wvRenderMode', {
                text: 'Rendu',
                tooltip: 'Masquer les gizmos de colorisation',
                onAction: () => setViewMode('render'),
                onSetup: (api: { setActive: (state: boolean) => void }) => {
                  api.setActive(viewModeRef.current === 'render')
                  const fn = () => api.setActive(viewModeRef.current === 'render')
                  ed.on('wv:mode', fn)
                  return () => ed.off('wv:mode', fn)
                }
              })

              ed.ui.registry.addButton('wvAnnotate', {
                text: 'Annoter',
                tooltip: 'Créer/éditer une annotation sur la sélection',
                onAction: () => {
                  const sel = ed.selection
                  const node = sel.getNode() as HTMLElement
                  const annEl = node?.closest?.('.wv-annotation') as HTMLElement | null
              
                  if (annEl) {
                    // EDIT existant
                    const id = annEl.getAttribute('data-ann-id') || ''
                    const data = annotationsRef.current[id]
                    setAnnMode('edit')
                    setAnnDraft({
                      id,
                      note: data?.note || '',
                      entity: data?.entity,
                      selection: null  // pas besoin pour edit
                    })
                    setAnnOpen(true)
                    return
                  }
              
                  // CREATE sur sélection
                  const rng: Range = sel.getRng()
                  const textSel = sel.getContent({ format:'text' })?.trim() || ''
                  if (!rng || !textSel) {
                    ed.notificationManager.open({ text:'Sélectionnez du texte à annoter.', type:'info', timeout: 2500 })
                    return
                  }
                  setAnnMode('create')
                  setAnnDraft({ id: makeAnnId(), note:'', entity:undefined, selection: rng })
                  setAnnOpen(true)
                }
              })
          
              // arrow nav + Esc (leave Enter/Tab to capture handlers below)
              ed.on('keydown', (ev: KeyboardEvent) => {
                if (!acItemsRef.current.length) return
                if (ev.key === 'ArrowDown') { ev.preventDefault(); setAcIndex(i => Math.min(i+1, acItemsRef.current.length-1)); return }
                if (ev.key === 'ArrowUp')   { ev.preventDefault(); setAcIndex(i => Math.max(i-1, 0)); return }
                if (ev.key === 'Escape')    { ev.preventDefault(); closeAC(); return }
                if (ev.key === 'Enter' || (ev.key === 'Tab' && !ev.shiftKey)) {
                  ev.preventDefault()
                  ev.stopPropagation()
                  ;(ev as any).stopImmediatePropagation?.()
                
                  const choice = acItemsRef.current[acIndexRef.current] as Suggestion | undefined
                  if (!choice) return
                
                  acceptRef.current = true
                  setTimeout(() => {
                    try { editorRef.current?.focus(false) } catch {}
                    pick(choice)
                  }, 0)
                }
              })

            // déclenchement au fil de la frappe
            ed.on('keyup', (ev: KeyboardEvent) => {
              if (acceptRef.current) { acceptRef.current = false; return }
              const ignore = ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Control','Alt','Meta','Shift','Tab','Escape','Enter']
              if (ignore.includes(ev.key)) return
              const collId = collectionIdRef.current
              if (!collId) { closeAC(); return }

              const { word } = getCurrentWord(ed)
              if ((word || '').length < 3) { closeAC(); return }

              const maybeAnchor = computeAnchor(ed)
              debounce(async () => {
                try {
                  const rows: Suggestion[] = await apiGet(
                    `collections/${collId}/autocomplete?q=${encodeURIComponent(word)}&limit=10`
                  )
                  if (rows.length) {
                    setAcItems(rows as AcItem[])
                    setAcIndex(0)
                    setAcAnchor(maybeAnchor)
                  } else {
                    closeAC()
                  }
                } catch { closeAC() }
              }, 150)
            })

            ed.on('click', (e: any) => {
              // Option : si tu veux que ça marche aussi en "Rendu", enlève cette ligne.
              if (viewModeRef.current !== 'edit') return
            
              // On ne réagit qu'au Ctrl/Cmd+clic
              if (!e.metaKey && !e.ctrlKey) return
            
              const target = (e.target as HTMLElement) || null
            
              // 1) Annotations (prioritaire si imbriquées)
              const annEl = target?.closest?.('.wv-annotation') as HTMLElement | null
              if (annEl) {
                e.preventDefault()
                const id = annEl.getAttribute('data-ann-id') || ''
                const data = annotationsRef.current[id]
                setAnnMode('edit')
                setAnnDraft({ id, note: data?.note || '', entity: data?.entity, selection: null })
                setAnnOpen(true)
                return
              }
            
              // 2) Entités (personnage / lieu / objet / évènement)
              const entEl = target?.closest?.('.wv-entity') as HTMLElement | null
              if (entEl) {
                e.preventDefault()
                const type = entEl.getAttribute('data-entity-type') as 'character'|'place'|'item'|'event' | null
                const id   = entEl.getAttribute('data-entity-id') || ''
                if (type && id) {
                  // ouvre le panneau/fiche
                  window.dispatchEvent(new CustomEvent('wv:open-entity', { detail: { type, id } }))
                }
              }
            })

            // si la page scroll/resize, recalcule l’ancre (si ouvert)
            const onReposition = () => {
              if (!acItems.length) return
              const pos = computeAnchor(ed)
              setAcAnchor(pos)
            }
            window.addEventListener('scroll', onReposition, true)
            window.addEventListener('resize', onReposition)
            ed.on('remove', () => {
              window.removeEventListener('scroll', onReposition, true)
              window.removeEventListener('resize', onReposition)
            })
          },
        }}
      />

      {/* Popover d’auto-complétion */}
      <AutocompletePopover
        anchor={acAnchor}
        items={acItems}
        activeIndex={acIndex}
        onHover={setAcIndex}
        onSelect={(i) => {
          const choice = acItemsRef.current[i] as Suggestion | undefined
          if (choice) pick(choice)
        }}
        onClose={closeAC}
      />

      {/* PANNEAU LATÉRAL */}
      {panelOpen && (
        <aside className="border rounded-xl bg-white shadow-sm p-3 h-fit sticky top-4 self-start">
          <div className="flex items-center gap-2 mb-2">
            <button
              className={`text-sm px-2 py-1 rounded ${panelTab==='notes' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
              onClick={() => setPanelTab('notes')}
            >
              Notes
            </button>
            <button
              className={`text-sm px-2 py-1 rounded ${panelTab==='analytics' ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
              onClick={() => setPanelTab('analytics')}
            >
              Analyse
            </button>
          </div>

          {panelTab === 'notes' ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={10}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Notes privées liées à ce chapitre (aide-mémoire, idées, TODOs…)"
              />
              <p className="text-xs text-gray-500">
                Astuce : ces notes ne sont pas exportées dans le PDF.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {analytics.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune entité détectée pour l’instant.</p>
              ) : (
                <ul className="space-y-1">
                  {analytics.map(e => (
                    <li key={`${e.type}:${e.id}`} className="flex items-center gap-2 text-sm">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded border"
                        title={e.type}
                        style={{
                          borderColor:
                            e.type==='character' ? '#93c5fd' :
                            e.type==='place'     ? '#86efac' :
                            e.type==='item'      ? '#fde68a' :
                            '#ddd',
                          background:
                            e.type==='character' ? '#e0f2fe' :
                            e.type==='place'     ? '#dcfce7' :
                            e.type==='item'      ? '#fef3c7' :
                            '#ede9fe'
                        }}
                      >
                        {e.label}
                      </span>
                      <span className="ml-auto text-xs text-gray-500 tabular-nums">{e.count}×</span>
                      <button className="text-xs text-indigo-600 hover:underline" onClick={() => jumpToEntity(e)}>voir</button>
                      <button className="text-xs text-gray-700 hover:underline" onClick={() => openEntityView(e)}>ouvrir</button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-gray-500">
                Comptage basé sur les entités insérées via l’autocomplétion.
              </p>
            </div>
          )}
        </aside>
      )}

      {annOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-3">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-3">
              <div className="font-medium">{annMode === 'create' ? 'Nouvelle annotation' : 'Modifier l’annotation'}</div>
              <div className="ml-auto">
                <button className="text-sm text-gray-500 hover:text-gray-700" onClick={()=>setAnnOpen(false)}>Fermer</button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Note</label>
                <textarea
                  rows={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={annDraft.note}
                  onChange={e=>setAnnDraft(d=>({...d, note:e.target.value}))}
                  placeholder="Texte libre lié à ce passage…"
                />
              </div>

              {/* Lien entité */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Lier une entité (optionnel)</label>
                  {annDraft.entity && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded border">
                      {annDraft.entity.label} <span className="text-gray-500">({annDraft.entity.type})</span>
                    </span>
                  )}
                </div>

                <EntityAttach
                  value={annDraft.entity}
                  onChange={(e)=> setAnnDraft(d=>({...d, entity:e || undefined}))}
                  collectionIdRef={collectionIdRef}
                />
              </div>
            </div>

            <div className="px-4 py-3 border-t flex items-center gap-2">
              {annDraft.entity && (
                <button
                  type="button"
                  className="btn-muted"
                  onClick={()=>{
                    window.dispatchEvent(new CustomEvent('wv:open-entity', {
                      detail: { type: annDraft.entity!.type, id: annDraft.entity!.id }
                    }))
                  }}
                >
                  Ouvrir la fiche liée
                </button>
              )}
              <div className="ml-auto flex gap-2">
                {annMode === 'edit' && (
                  <button
                    className="btn-danger"
                    onClick={()=>{
                      // supprimer annotation (DOM + store)
                      const ed = editorRef.current
                      if (!ed) return
                      const body = ed.getBody()
                      const el = body?.querySelector(`span.wv-annotation[data-ann-id="${annDraft.id}"]`) as HTMLElement | null
                      ed.undoManager.transact(()=>{
                        if (el) {
                          // unwrap span
                          const parent = el.parentNode
                          while (el.firstChild) parent?.insertBefore(el.firstChild, el)
                          parent?.removeChild(el)
                        }
                      })
                      setAnnotations(prev=>{
                        const copy = {...prev}; delete copy[annDraft.id]; return copy
                      })
                      setAnnOpen(false)
                    }}
                  >
                    Supprimer
                  </button>
                )}

                <button className="btn-secondary" onClick={()=>setAnnOpen(false)}>Annuler</button>
                <button
                  className="btn-primary"
                  onClick={()=>{
                    const data: AnnotationData = {
                      id: annDraft.id || makeAnnId(),
                      note: annDraft.note || '',
                      entity: annDraft.entity
                    }
                    if (annMode === 'create' && annDraft.selection) {
                      wrapSelectionWithAnnotation(annDraft.selection, data)
                    } else {
                      updateAnnotationDom(data)
                    }
                    setAnnotations(prev => ({ ...prev, [data.id]: data }))
                    setAnnOpen(false)
                  }}
                >
                  {annMode === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="flex justify-end">
        <button onClick={save} className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le chapitre'}
        </button>
      </div>
    </div>
  )
}

