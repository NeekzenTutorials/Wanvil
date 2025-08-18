// src/components/places/PlacesForm.tsx
import { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../../utils/fetcher'
import { Editor } from '@tinymce/tinymce-react'

type Tag = { id:string; name:string; color?:string }

type CustomField = {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'richtext'
  value: any
}

export function PlacesForm({ placeId, collectionId, onClose }:{ placeId:string, collectionId:string, onClose:()=>void }) {
  const [data, setData] = useState<any>(null) // { name, location, description, images, content, tags }
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      apiGet<any>(`places/${placeId}`),
      apiGet<Tag[]>(`collections/${collectionId}/tags?scope=place`)
    ]).then(([p, tags]) => {
      setData({ ...p, content: p.content || {} })
      setAllTags(tags)
      setSelectedTagIds((p.tags || []).map((t:any) => t.id))
    })
  }, [placeId, collectionId])

  const toggleTag = (id:string) => setSelectedTagIds(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id])

  // --- Images ---------------------------------------------------------------
  const addImage = (url:string) => {
    if (!url.trim()) return
    setData((prev:any) => ({ ...prev, images: [...(prev.images || []), url.trim()] }))
  }
  const removeImage = (i:number) => setData((prev:any) => ({ ...prev, images: (prev.images || []).filter((_:any, idx:number) => idx !== i) }))

  // --- Champs personnalisés par Lieu ---------------------------------------
  const getCustomFields = (): CustomField[] => data?.content?.customFields || []
  const setCustomFields = (fields: CustomField[]) => setData((prev:any) => ({ ...prev, content: { ...(prev.content||{}), customFields: fields } }))

  const addCustomField = () => {
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
    setCustomFields([ ...getCustomFields(), { id, label: 'Nouveau champ', type: 'text', value: '' } ])
  }
  const updateCustomField = (id:string, patch:Partial<CustomField>) => {
    setCustomFields(getCustomFields().map(f => f.id === id ? { ...f, ...patch } : f))
  }
  const removeCustomField = (id:string) => setCustomFields(getCustomFields().filter(f => f.id !== id))

  const save = async () => {
    await apiPut(`places/${placeId}`, {
      name: data.name,
      location: data.location,
      description: data.description,
      images: data.images || [],
      content: data.content || {},
      tagIds: selectedTagIds,
    })
    onClose()
  }

  if (!data) return null

  const customFields = getCustomFields()

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
          {/* Champs de base */}
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Nom du lieu" value={data.name || ''} onChange={e=>setData((p:any)=>({...p, name:e.target.value}))}/>
            <input className="border rounded px-3 py-2" placeholder="Localisation" value={data.location || ''} onChange={e=>setData((p:any)=>({...p, location:e.target.value}))}/>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-700">Description</div>
            <Editor
              value={data.description || ''}
              apiKey="ll8xm35gqhxdg1vzghapkgye0nj2t7ob6xigqmhm8ne5na5h"
              onEditorChange={(html)=>setData((p:any)=>({...p, description: html}))}
              init={{ menubar:false, height:300, plugins:'link lists table', toolbar:'bold italic | bullist numlist | link table' }}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-700">Tags</div>
            <div className="flex gap-2 flex-wrap">
              {allTags.map(t => {
                const on = selectedTagIds.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={()=>toggleTag(t.id)}
                    className={`px-2 py-1 rounded border text-sm ${on ? 'bg-gray-900 text-white' : ''}`}
                    title={(t as any).note || undefined}
                    style={{ borderColor: t.color || '#e5e7eb', backgroundColor: on ? (t.color || '#111827') : undefined }}
                  >
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
              <input id="img-url" type="url" placeholder="URL d’image" className="border rounded px-3 py-2 flex-1"/>
              <button className="btn-secondary" onClick={()=>{
                const el = document.getElementById('img-url') as HTMLInputElement
                addImage(el.value)
                if (el) el.value = ''
              }}>Ajouter</button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {(data.images || []).map((url:string, i:number) => (
                <figure key={i} className="relative group">
                  <img src={url} alt="" className="w-full h-24 object-cover rounded border" />
                  <button className="absolute top-1 right-1 text-xs px-1.5 py-0.5 bg-white/90 border rounded opacity-0 group-hover:opacity-100" onClick={()=>removeImage(i)}>Suppr</button>
                </figure>
              ))}
              {!((data.images||[]).length) && <div className="text-xs text-gray-400">Aucune image.</div>}
            </div>
          </div>

          {/* Champs personnalisés par lieu */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-700">Champs personnalisés</div>
              <button className="btn-secondary" onClick={addCustomField}>Ajouter un champ</button>
            </div>

            <ul className="space-y-3">
              {customFields.map((f) => (
                <li key={f.id} className="border rounded-xl p-3">
                  <div className="grid sm:grid-cols-[1fr_180px_auto] gap-2 items-start">
                    <input className="border rounded px-3 py-2" placeholder="Libellé" value={f.label}
                           onChange={e=>updateCustomField(f.id, { label: e.target.value })}/>
                    <select className="border rounded px-3 py-2" value={f.type}
                            onChange={e=>updateCustomField(f.id, { type: e.target.value as CustomField['type'] })}>
                      <option value="text">Texte</option>
                      <option value="textarea">Paragraphe</option>
                      <option value="number">Nombre</option>
                      <option value="date">Date</option>
                      <option value="richtext">Texte riche</option>
                    </select>
                    <div className="flex justify-end">
                      <button className="btn-danger" onClick={()=>removeCustomField(f.id)}>Supprimer</button>
                    </div>
                  </div>

                  <div className="mt-2">
                    {f.type === 'text' && (
                      <input className="border rounded px-3 py-2 w-full" value={f.value || ''}
                             onChange={e=>updateCustomField(f.id, { value: e.target.value })}/>
                    )}
                    {f.type === 'textarea' && (
                      <textarea className="border rounded px-3 py-2 w-full" rows={4} value={f.value || ''}
                                onChange={e=>updateCustomField(f.id, { value: e.target.value })}/>
                    )}
                    {f.type === 'number' && (
                      <input type="number" className="border rounded px-3 py-2 w-full" value={f.value ?? ''}
                             onChange={e=>updateCustomField(f.id, { value: e.target.value ? Number(e.target.value) : null })}/>
                    )}
                    {f.type === 'date' && (
                      <input type="date" className="border rounded px-3 py-2 w-full" value={f.value || ''}
                             onChange={e=>updateCustomField(f.id, { value: e.target.value || null })}/>
                    )}
                    {f.type === 'richtext' && (
                      <Editor
                        value={f.value || ''}
                        apiKey="ll8xm35gqhxdg1vzghapkgye0nj2t7ob6xigqmhm8ne5na5h"
                        onEditorChange={(html)=>updateCustomField(f.id, { value: html })}
                        init={{ menubar:false, height:250, plugins:'link lists table', toolbar:'bold italic | bullist numlist | link table' }}
                      />
                    )}
                  </div>
                </li>
              ))}
              {!customFields.length && <li className="text-sm text-gray-500">Aucun champ pour l’instant.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}