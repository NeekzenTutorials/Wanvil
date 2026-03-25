import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/fetcher'
import { useTranslation } from '../../i18n'

type Collection = { id: string; name: string }
type Tag = { id: string; name: string; color?: string; note?: string; collectionId: string; scope: 'event'|'item'|'place'|'character' }

export function EventsTagsManagerPage({ projectId }: { projectId: string }) {
  const { t } = useTranslation()
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [tags, setTags] = useState<Tag[]>([])
  const [draft, setDraft] = useState<{ name:string; color:string; note:string }>({ name:'', color:'#111827', note:'' })
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    apiGet<Collection[]>(`projects/${projectId}/collections`).then(cols => {
      setCollections(cols)
      if (cols.length) setCollectionId(cols[0].id)
    })
  }, [projectId])

  useEffect(() => {
    if (!collectionId) return
    apiGet<Tag[]>(`collections/${collectionId}/tags?scope=event`).then(setTags)
  }, [collectionId])

  const createTag = async () => {
    if (!collectionId || !draft.name.trim()) return
    const tag = await apiPost<Tag>(`collections/${collectionId}/tags`, {
      name: draft.name.trim(), color: draft.color || null, note: draft.note || null, scope: 'event'
    })
    setTags(prev => [tag, ...prev])
    setDraft({ name:'', color:'#111827', note:'' })
  }

  const saveTag = async (tag: Tag) => {
    setSavingId(tag.id)
    try {
      const updated = await apiPut<Tag>(`tags/${tag.id}`, {
        name: tag.name, color: tag.color, note: tag.note ?? null, scope: 'event'
      })
      setTags(prev => prev.map(t => t.id === tag.id ? updated : t))
    } finally {
      setSavingId(null)
    }
  }

  const removeTag = async (id:string) => {
    const tag = tags.find(x => x.id === id)
    if (!confirm(`Supprimer définitivement le tag "${tag?.name ?? 'tag'}" ?`)) return
    await apiDelete(`tags/${id}`)
    setTags(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 dark:text-gray-400">{t('tags.collection')}</label>
        <select className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-800 dark:text-gray-100" value={collectionId ?? ''} onChange={e=>setCollectionId(e.target.value || null)}>
          {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
        <h3 className="font-semibold mb-3">{t('tags.createEvents')}</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <input className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-gray-100" placeholder={t('common.name')} value={draft.name}
                 onChange={e=>setDraft(s=>({...s, name:e.target.value}))}/>
          <input className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700" type="color" value={draft.color}
                 onChange={e=>setDraft(s=>({...s, color:e.target.value}))}/>
          <input className="border dark:border-gray-600 rounded px-3 py-2 sm:col-span-3 dark:bg-gray-700 dark:text-gray-100" placeholder={t('tags.annotation')}
                 value={draft.note} onChange={e=>setDraft(s=>({...s, note:e.target.value}))}/>
        </div>
        <div className="mt-3">
          <button className="btn-primary" onClick={createTag} disabled={!draft.name.trim()}>
            Créer
          </button>
        </div>
      </div>

      <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
        <h3 className="font-semibold mb-3">{t('tags.collectionTags')}</h3>
        <ul className="space-y-3">
          {tags.map(tag => (
            <li key={tag.id} className="grid sm:grid-cols-[1fr_100px_1fr_auto] gap-2 items-center">
              <input className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-gray-100" value={tag.name}
                     onChange={e=>setTags(prev => prev.map(x => x.id===tag.id ? {...x, name:e.target.value} : x))}/>
              <input className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700" type="color" value={tag.color || '#111827'}
                     onChange={e=>setTags(prev => prev.map(x => x.id===tag.id ? {...x, color:e.target.value} : x))}/>
              <input className="border dark:border-gray-600 rounded px-3 py-2 dark:bg-gray-700 dark:text-gray-100" placeholder="Annotation"
                     value={tag.note || ''} onChange={e=>setTags(prev => prev.map(x => x.id===tag.id ? {...x, note:e.target.value} : x))}/>
              <div className="flex gap-2 justify-end">
                <button className="btn-secondary" onClick={()=>saveTag(tag)} disabled={savingId===tag.id}>
                  {savingId===tag.id ? '…' : t('common.save')}
                </button>
                <button className="btn-danger" onClick={()=>removeTag(tag.id)}>{t('common.delete')}</button>
              </div>
            </li>
          ))}
          {!tags.length && <li className="text-sm text-gray-500 dark:text-gray-400">{t('tags.noTags')}</li>}
        </ul>
      </div>
    </div>
  )
}
