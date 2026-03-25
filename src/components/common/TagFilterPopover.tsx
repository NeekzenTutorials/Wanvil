import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '../../i18n'

export default function TagFilterPopover(props: {
  tags: { id:string; name:string; color?:string; note?:string }[]
  noteOptions: string[]
  selectedTagIds: string[]
  onChange: (ids: string[]) => void
}) {
  const { tags, noteOptions, selectedTagIds, onChange } = props
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Fermer si clic en dehors
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target) || btnRef.current?.contains(target)) return
      setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  // Recherche
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return tags
    return tags.filter(tag => tag.name.toLowerCase().includes(needle))
  }, [tags, q])

  // Groupes par annotation
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    const noNoteKey = '__none__'
    map.set(noNoteKey, [])
    for (const tag of filtered) {
      const key = tag.note || noNoteKey
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(tag)
    }
    // Trie par nom dans chaque section
    for (const [k, arr] of map.entries()) {
      map.set(k, arr.slice().sort((a, b) => a.name.localeCompare(b.name)))
    }
    // Ordonner sections : Sans annotation -> par ordre alpha d’annotation
    const entries = Array.from(map.entries())
    entries.sort((a, b) => {
      if (a[0] === '__none__') return -1
      if (b[0] === '__none__') return 1
      return a[0].localeCompare(b[0])
    })
    return entries
  }, [filtered])

  const toggle = (id: string) => {
    onChange(selectedTagIds.includes(id) ? selectedTagIds.filter(x => x !== id) : [...selectedTagIds, id])
  }

  const clearAll = () => onChange([])
  const selectAllVisible = () => {
    const visibleIds = filtered.map(tag => tag.id)
    const merged = new Set([...selectedTagIds, ...visibleIds])
    onChange(Array.from(merged))
  }

  const count = selectedTagIds.length

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-2 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
        aria-expanded={open}
      >
        Tags {count > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-900 text-white">{count}</span>}
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-3"
        >
          {/* Barre d’actions */}
          <div className="flex items-center gap-2 mb-2">
            <input
              className="border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 flex-1 bg-white dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('tags.searchTag')}
              value={q}
              onChange={e => setQ(e.target.value)}
            />
            <button onClick={selectAllVisible} className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
              {t('tags.allVisible')}
            </button>
            <button onClick={clearAll} className="text-xs px-2 py-1 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300">
              {t('tags.clear')}
            </button>
          </div>

          {/* Sections par annotation */}
          <div className="max-h-64 overflow-y-auto pr-1">
            {grouped.map(([note, arr]) => (
              <div key={note} className="mb-3">
                <div className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  {note === '__none__' ? t('tags.noAnnotation') : note}
                </div>
                <ul className="space-y-1">
                  {arr.map(tag => {
                    const on = selectedTagIds.includes(tag.id)
                    return (
                      <li key={tag.id}>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggle(tag.id)}
                          />
                          <span
                            className="inline-block h-3 w-3 rounded"
                            style={{ backgroundColor: tag.color || '#e5e7eb', border: '1px solid #e5e7eb' }}
                          />
                          <span className="text-sm">{tag.name}</span>
                          {tag.note && <span className="ml-auto text-xs text-gray-400">{tag.note}</span>}
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{t('tags.noTag')}</div>
            )}
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300" onClick={() => setOpen(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
