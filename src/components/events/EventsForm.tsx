// src/components/events/EventsForm.tsx
import { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../../utils/fetcher'
import { Editor } from '@tinymce/tinymce-react'

type Tag = { id:string; name:string; color?:string; note?:string }
type CustomField = {
  id: string
  label: string
  type: 'text'|'textarea'|'number'|'date'|'richtext'
  value: any
}

const TINYMCE_API_KEY = import.meta.env.VITE_TINYMCE_API_KEY || '';

export function EventsForm({ eventId, collectionId, onClose }:{
  eventId:string, collectionId:string, onClose:()=>void
}) {
  const [data, setData] = useState<any>(null) // { name, startDate, endDate, description, images[], content{customFields[]}, tags[] }
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      apiGet<any>(`events/${eventId}`),
      apiGet<Tag[]>(`collections/${collectionId}/tags?scope=event`)
    ]).then(([ev, tags]) => {
      const content = ev.content || {}
      if (!Array.isArray(content.customFields)) content.customFields = []
      setData({ ...ev, content })
      setAllTags(tags)
      setSelectedTagIds((ev.tags || []).map((t:any)=>t.id))
    })
  }, [eventId, collectionId])

  const toggleTag = (id:string) =>
    setSelectedTagIds(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id])

  // images
  const addImage = (url:string) => {
    if (!url.trim()) return
    setData((p:any)=>({ ...p, images: [...(p.images||[]), url.trim()] }))
  }
  const removeImage = (i:number) =>
    setData((p:any)=>({ ...p, images: (p.images||[]).filter((_:any, idx:number)=>idx!==i) }))

  // custom fields
  const getFields = ():CustomField[] => data?.content?.customFields || []
  const setFields = (arr:CustomField[]) =>
    setData((p:any)=>({ ...p, content: { ...(p.content||{}), customFields: arr }}))
  const addField = () => {
    const id = (crypto as any)?.randomUUID?.() || Math.random().toString(36).slice(2)
    setFields([...getFields(), { id, label:'Nouveau champ', type:'text', value:'' }])
  }
  const updateField = (id:string, patch:Partial<CustomField>) =>
    setFields(getFields().map(f=>f.id===id?{...f, ...patch}:f))
  const removeField = (id:string) =>
    setFields(getFields().filter(f=>f.id!==id))

  const save = async () => {
    if (!data.name?.trim() || !data.startDate) { alert('Nom et date de début requis.'); return }
    await apiPut(`events/${eventId}`, {
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate || null,
      description: data.description || '',
      images: data.images || [],
      content: data.content || {},
      tagIds: selectedTagIds
    })
    onClose()
  }

  if (!data) return null
  const fields = getFields()

  return (
    <div className="fixed inset-0 bg-black/40 flex">
      <div className="ml-auto h-full w-full max-w-3xl bg-white flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <h3 className="font-semibold">Éditer {data.name}</h3>
          <div className="ml-auto flex gap-2">
            <button className="btn-secondary" onClick={onClose}>Annuler</button>
            <button className="btn-primary" onClick={save}>Enregistrer</button>
          </div>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Base */}
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2 sm:col-span-2" placeholder="Nom de l’évènement"
                   value={data.name || ''} onChange={e=>setData((p:any)=>({...p, name:e.target.value}))}/>
            <input className="border rounded px-3 py-2" type="date" required
                   value={data.startDate || ''} onChange={e=>setData((p:any)=>({...p, startDate:e.target.value}))}/>
            <input className="border rounded px-3 py-2" type="date"
                   value={data.endDate || ''} onChange={e=>setData((p:any)=>({...p, endDate:e.target.value || null}))}/>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-700">Description</div>
            <Editor
              licenseKey='gpl'
              tinymceScriptSrc="/tinymce/tinymce.min.js"
              value={data.description || ''}
              onEditorChange={(html)=>setData((p:any)=>({...p, description: html}))}
              init={{ base_url: '/tinymce', suffix: '.min', menubar:false, height:300, plugins:'link lists table', toolbar:'bold italic | bullist numlist | link table' }}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-700">Tags (Évènements)</div>
            <div className="flex gap-2 flex-wrap">
              {allTags.map(t => {
                const on = selectedTagIds.includes(t.id)
                return (
                  <button key={t.id} type="button" onClick={()=>toggleTag(t.id)}
                    className={`px-2 py-1 rounded border text-sm ${on?'bg-gray-900 text-white':''}`}
                    title={t.note || undefined}
                    style={{ borderColor: t.color || '#e5e7eb', backgroundColor: on ? (t.color || '#111827') : undefined }}>
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Images</div>
            <div className="flex gap-2">
              <input id="event-img-url" type="url" placeholder="URL d’image" className="border rounded px-3 py-2 flex-1"/>
              <button className="btn-secondary" onClick={()=>{
                const el = document.getElementById('event-img-url') as HTMLInputElement
                addImage(el.value); if (el) el.value = ''
              }}>Ajouter</button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {(data.images || []).map((url:string,i:number)=>(
                <figure key={i} className="relative group">
                  <img src={url} alt="" className="w-full h-24 object-cover rounded border"/>
                  <button className="absolute top-1 right-1 text-xs px-1.5 py-0.5 bg-white/90 border rounded opacity-0 group-hover:opacity-100"
                          onClick={()=>removeImage(i)}>Suppr</button>
                </figure>
              ))}
              {!((data.images||[]).length) && <div className="text-xs text-gray-400">Aucune image.</div>}
            </div>
          </div>

          {/* Champs personnalisés */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-700">Champs personnalisés</div>
              <button className="btn-secondary" onClick={addField}>Ajouter un champ</button>
            </div>

            <ul className="space-y-3">
              {fields.map(f=>(
                <li key={f.id} className="border rounded-xl p-3">
                  <div className="grid sm:grid-cols-[1fr_180px_auto] gap-2 items-start">
                    <input className="border rounded px-3 py-2" placeholder="Libellé" value={f.label}
                           onChange={e=>updateField(f.id,{label:e.target.value})}/>
                    <select className="border rounded px-3 py-2" value={f.type}
                            onChange={e=>updateField(f.id,{type:e.target.value as CustomField['type']})}>
                      <option value="text">Texte</option>
                      <option value="textarea">Paragraphe</option>
                      <option value="number">Nombre</option>
                      <option value="date">Date</option>
                      <option value="richtext">Texte riche</option>
                    </select>
                    <div className="flex justify-end">
                      <button className="btn-danger" onClick={()=>removeField(f.id)}>Supprimer</button>
                    </div>
                  </div>

                  <div className="mt-2">
                    {f.type === 'text' && (
                      <input className="border rounded px-3 py-2 w-full" value={f.value || ''}
                             onChange={e=>updateField(f.id,{value:e.target.value})}/>
                    )}
                    {f.type === 'textarea' && (
                      <textarea className="border rounded px-3 py-2 w-full" rows={4} value={f.value || ''}
                                onChange={e=>updateField(f.id,{value:e.target.value})}/>
                    )}
                    {f.type === 'number' && (
                      <input type="number" className="border rounded px-3 py-2 w-full" value={f.value ?? ''}
                             onChange={e=>updateField(f.id,{value:e.target.value?Number(e.target.value):null})}/>
                    )}
                    {f.type === 'date' && (
                      <input type="date" className="border rounded px-3 py-2 w-full" value={f.value || ''}
                             onChange={e=>updateField(f.id,{value:e.target.value || null})}/>
                    )}
                    {f.type === 'richtext' && (
                      <Editor
                        value={f.value || ''}
                        licenseKey="gpl"
                        tinymceScriptSrc="/tinymce/tinymce.min.js"
                        onEditorChange={(html)=>updateField(f.id,{value: html})}
                        init={{ base_url: '/tinymce', suffix: '.min', menubar:false, height:250, plugins:'link lists table', toolbar:'bold italic | bullist numlist | link table' }}
                      />
                    )}
                  </div>
                </li>
              ))}
              {!fields.length && <li className="text-sm text-gray-500">Aucun champ pour l’instant.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
