import { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../../utils/fetcher'
import type { CharacterTemplate, TemplateField } from '../../types/character'
import { Editor } from '@tinymce/tinymce-react'
type Tag = { id:string; name:string; color?:string }

export function CharacterForm({ characterId, collectionId, onClose }:{
  characterId:string, collectionId:string, onClose:()=>void
}) {
  const [template, setTemplate] = useState<CharacterTemplate | null>(null)
  const [data, setData] = useState<any>(null) // personnage (builtin + content)
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  useEffect(() => {
    // charge le template seulement
    apiGet<{characterTemplate: CharacterTemplate}>(`collections/${collectionId}/characters/template`)
      .then(r => setTemplate(r.characterTemplate || {version:1, fields:[]}))
  }, [collectionId])
  
  useEffect(() => {
    // charge perso + tags de la collection en parallèle
    Promise.all([
      apiGet<any>(`characters/${characterId}`),
      apiGet<Tag[]>(`collections/${collectionId}/tags?scope=character`)
    ]).then(([c, tags]) => {
      setData(c)
      setAllTags(tags)
      setSelectedTagIds((c.tags || []).map((t:any) => t.id))
    })
  }, [characterId, collectionId])

  const toggleTag = (id:string) =>
    setSelectedTagIds(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id])

  const setContent = (key:string, val:any) =>
    setData((prev:any)=> ({...prev, content: {...(prev.content||{}), [key]: val}}))

  const save = async () => {
    await apiPut(`characters/${characterId}`, {
      firstname: data.firstname,
      lastname:  data.lastname,
      age: data.age,
      birthdate: data.birthdate,
      avatarUrl: data.avatarUrl,
      content: data.content,
      tagIds: selectedTagIds,
    })
    onClose()
  }

  if (!template || !data) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex">
      <div className="ml-auto h-full w-full max-w-3xl bg-white flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <h3 className="font-semibold">Éditer {data.firstname} {data.lastname}</h3>
          <div className="ml-auto flex gap-2">
            <button className="btn-secondary" onClick={onClose}>Annuler</button>
            <button className="btn-primary" onClick={save}>Enregistrer</button>
          </div>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          {/* champs natifs */}
          <div className="grid sm:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Prénom" value={data.firstname} onChange={e=>setData((p:any)=>({...p, firstname:e.target.value}))}/>
            <input className="border rounded px-3 py-2" placeholder="Nom" value={data.lastname} onChange={e=>setData((p:any)=>({...p, lastname:e.target.value}))}/>
            <input className="border rounded px-3 py-2" placeholder="Âge" type="number" value={data.age ?? ''} onChange={e=>setData((p:any)=>({...p, age: e.target.value ? Number(e.target.value) : null}))}/>
            <input className="border rounded px-3 py-2" placeholder="Naissance" type="date" value={data.birthdate ?? ''} onChange={e=>setData((p:any)=>({...p, birthdate:e.target.value || null}))}/>
            <input className="border rounded px-3 py-2 col-span-full" placeholder="URL avatar" value={data.avatarUrl ?? ''} onChange={e=>setData((p:any)=>({...p, avatarUrl:e.target.value || null}))}/>
          </div>
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
                    title={/* si tu veux afficher l’annotation : */ (t as any).note || undefined}
                    style={{ borderColor: t.color || '#e5e7eb', backgroundColor: on ? (t.color || '#111827') : undefined }}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* champs dynamiques */}
          {template.fields.map((f) => (
            f.builtin ? null : (
              <Field key={f.id} field={f} value={(data.content||{})[f.id]} onChange={(v:any)=>setContent(f.id, v)} />
            )
          ))}
        </div>
      </div>
    </div>
  )
}

function Field({ field, value, onChange }:{ field:TemplateField; value:any; onChange:(v:any)=>void }) {
  if (field.type === 'text')     return <Labeled label={field.label}><input className="border rounded px-3 py-2 w-full" value={value||''} onChange={e=>onChange(e.target.value)}/></Labeled>
  if (field.type === 'textarea') return <Labeled label={field.label}><textarea className="border rounded px-3 py-2 w-full" value={value||''} onChange={e=>onChange(e.target.value)} rows={4}/></Labeled>
  if (field.type === 'number')   return <Labeled label={field.label}><input type="number" className="border rounded px-3 py-2 w-full" value={value ?? ''} onChange={e=>onChange(e.target.value ? Number(e.target.value) : null)}/></Labeled>
  if (field.type === 'date')     return <Labeled label={field.label}><input type="date" className="border rounded px-3 py-2 w-full" value={value||''} onChange={e=>onChange(e.target.value || null)}/></Labeled>
  if (field.type === 'select')   return <Labeled label={field.label}>
    <select className="border rounded px-3 py-2 w-full" value={value||''} onChange={e=>onChange(e.target.value)}>
      <option value="" />
      {(field.options||[]).map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </Labeled>
  if (field.type === 'chips')    return <Labeled label={field.label}>
    <Chips value={Array.isArray(value)? value: []} options={field.options||[]} onChange={onChange} />
  </Labeled>
  if (field.type === 'richtext') return <Labeled label={field.label}>
    <Editor value={value||''} apiKey="ll8xm35gqhxdg1vzghapkgye0nj2t7ob6xigqmhm8ne5na5h" onEditorChange={onChange} init={{ menubar:false, height:300, plugins:'link lists table', toolbar:'bold italic | bullist numlist | link table' }} />
  </Labeled>
  if (field.type === 'images')   return <Labeled label={field.label}>
    <input type="url" placeholder="URL d’image (séparées par virgules)" className="border rounded px-3 py-2 w-full"
           value={(Array.isArray(value)? value: []).join(', ')}
           onChange={e=>onChange(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}/>
  </Labeled>
  return null
}

const Labeled = ({label, children}:{label:string; children:any}) => (
  <div className="space-y-1">
    <div className="text-sm font-medium text-gray-700">{label}</div>
    {children}
  </div>
)

function Chips({ value, options, onChange }:{ value:string[]; options:string[]; onChange:(v:string[])=>void }) {
  const toggle = (v:string) => onChange(value.includes(v) ? value.filter(x=>x!==v) : [...value, v])
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map(o => (
        <button key={o} type="button" onClick={()=>toggle(o)} className={`px-2 py-1 rounded border text-sm ${value.includes(o) ? 'bg-gray-900 text-white' : ''}`}>
          {o}
        </button>
      ))}
    </div>
  )
}