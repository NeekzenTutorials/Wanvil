import { useEffect, useState } from 'react'
import { apiGet, apiPut } from '../../utils/fetcher'
import type { CharacterTemplate, TemplateField } from '../../types/character'
import { useTranslation } from '../../i18n'

const FIELD_TYPES = [
  { type:'text', label:'Texte court' },
  { type:'textarea', label:'Texte long' },
  { type:'number', label:'Nombre' },
  { type:'date', label:'Date' },
  { type:'select', label:'Choix (liste)' },
  { type:'chips', label:'Étiquettes multiples' },
  { type:'richtext', label:'Texte riche' },
  { type:'images', label:'Images' },
]

export function TemplateEditor({ collectionId, onSaved }: { collectionId:string, onSaved?:() => void }) {
  const { t } = useTranslation()
  const [tpl, setTpl] = useState<CharacterTemplate | null>(null)

  useEffect(() => {
    apiGet<{characterTemplate: CharacterTemplate}>(`collections/${collectionId}/characters/template`)
      .then(r => setTpl(r.characterTemplate || {version:1, fields:[]}))
  }, [collectionId])

  const addField = (type:string) => {
    setTpl(prev => prev ? ({
      ...prev,
      fields: [...prev.fields, { id: crypto.randomUUID().slice(0,8), type, label: 'Nouveau champ' } as any]
    }) : prev)
  }

  const save = async () => {
    await apiPut(`collections/${collectionId}/characters/template`, { characterTemplate: tpl })
    onSaved?.()
  }

  if (!tpl) return null

  return (
    <div className="border dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800 shadow-sm space-y-3">
      <div className="flex flex-wrap gap-2">
        {FIELD_TYPES.map(f => (
          <button key={f.type} onClick={()=>addField(f.type)} className="btn-secondary">{f.label}</button>
        ))}
        <button onClick={save} className="btn-primary ml-auto">{t('common.save')}</button>
      </div>

      <ul className="space-y-2">
        {tpl.fields.map((f, i) => (
          <li key={i} className="border dark:border-gray-700 rounded p-3 flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <input className="border dark:border-gray-600 rounded px-2 py-1 flex-1 dark:bg-gray-700 dark:text-gray-100" value={f.label}
                     onChange={e=>setTpl(prev => prev && ({...prev, fields: prev.fields.map((x,idx)=> idx===i? {...x, label:e.target.value}:x)}))}/>
              <span className="text-xs rounded bg-gray-100 dark:bg-gray-700 px-2 py-1">{f.type}</span>
              {!f.builtin && (
                <button className="btn-danger" onClick={()=>setTpl(prev=> prev && ({...prev, fields: prev.fields.filter((_,idx)=>idx!==i)}))}>
                  {t('common.delete')}
                </button>
              )}
            </div>
            {['select','chips'].includes(f.type) && (
              <input className="border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-gray-100"
                     placeholder="Options séparées par des virgules"
                     value={(f.options||[]).join(', ')}
                     onChange={e=>setTpl(prev => prev && ({...prev, fields: prev.fields.map((x,idx)=> idx===i? {...x, options: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}:x)}))}/>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}