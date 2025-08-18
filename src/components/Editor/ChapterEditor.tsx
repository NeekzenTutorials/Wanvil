// src/components/Editor/ChapterEditor.tsx
import { useEffect, useRef, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { apiGet, apiPut } from '../../utils/fetcher'
import AutocompletePopover, { type AcItem } from '../common/AutoCompletePopover'

type Chapter = { id: string; title: string; content: string; position?: number }

interface ChapterEditorProps {
  chapterId: string
  onSaved?: () => void
  collectionId?: string
}

type Suggestion = { id: string; type: 'character'|'place'|'item'; label: string; hint?: string | null }

export default function ChapterEditor({ chapterId, onSaved, collectionId: collectionIdProp }: ChapterEditorProps) {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  // ---- collectionId (avec ref pour TinyMCE closures)
  const [collectionId, setCollectionId] = useState<string | null>(collectionIdProp ?? null)
  const collectionIdRef = useRef<string | null>(collectionIdProp ?? null)
  useEffect(() => { collectionIdRef.current = collectionIdProp ?? collectionId }, [collectionIdProp, collectionId])

  // ---- charge contenu
  useEffect(() => {
    setLoading(true)
    apiGet<Chapter>(`chapters/${chapterId}`)
      .then((c) => setContent(c.content || ''))
      .finally(() => setLoading(false))
  }, [chapterId])

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

  const save = async () => {
    setSaving(true)
    try { await apiPut(`chapters/${chapterId}`, { content }); onSaved?.() }
    finally { setSaving(false) }
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
    const html = `<span data-entity-type="${s.type}" data-entity-id="${s.id}" class="wv-entity">${escapeHtml(s.label)}</span>`
  
    ed.undoManager.transact(() => {
      if (rng) ed.selection.setRng(rng)
      ed.insertContent(html)
      ed.selection.collapse(false)
    })
  
    setTimeout(() => { acceptRef.current = false; closeAC() }, 0)
  }

  

  return (
    <div className="space-y-3">
      <Editor
        value={content}
        onEditorChange={(v) => setContent(v)}
        onInit={(_, editor) => { editorRef.current = editor }}  // garder une réf de l’instance
        apiKey="ll8xm35gqhxdg1vzghapkgye0nj2t7ob6xigqmhm8ne5na5h"
        init={{
          height: 600,
          menubar: false,
          branding: false,
          toolbar_mode: 'sliding',
          extended_valid_elements: 'span[data-entity-type|data-entity-id|class]',
          plugins: 'lists link image table code help wordcount fullscreen searchreplace visualblocks pagebreak',
          toolbar:
            'undo redo | blocks | bold italic underline strikethrough | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist outdent indent | link image table pagebreak | ' +
            'removeformat | fullscreen | code',
            setup: (ed:any) => {
              ed.on('blur', closeAC)
            
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
                    setAcItems(rows)
                    setAcIndex(0)
                    setAcAnchor(maybeAnchor)
                  } else {
                    closeAC()
                  }
                } catch { closeAC() }
              }, 150)
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

      <div className="flex justify-end">
        <button onClick={save} className="btn-primary" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le chapitre'}
        </button>
      </div>
    </div>
  )
}
