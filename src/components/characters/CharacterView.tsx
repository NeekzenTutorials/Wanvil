// src/components/characters/CharacterView.tsx
import { useEffect, useState } from 'react'
import { apiGet } from '../../utils/fetcher'
import type { CharacterTemplate, TemplateField } from '../../types/character'
import ModalPortal from '../common/ModalPortal'

type Tag = { id:string; name:string; color?:string; note?:string }

export function CharacterView({
  characterId,
  onClose,
  onEdit
}:{
  characterId: string
  onClose: () => void
  onEdit?: (id:string)=>void
}) {
  const [data, setData] = useState<any>(null)
  const [template, setTemplate] = useState<CharacterTemplate | null>(null)

  // 1) charger le personnage
  useEffect(() => {
    apiGet<any>(`characters/${characterId}`).then(setData)
  }, [characterId])

  // 2) charger le template de la collection du personnage
  useEffect(() => {
    if (!data?.collectionId) return
    apiGet<{ characterTemplate: CharacterTemplate }>(
      `collections/${data.collectionId}/characters/template`
    ).then(res => setTemplate(res.characterTemplate || { version: 1, fields: [] }))
  }, [data?.collectionId])

  if (!data) return null

  const renderField = (f: TemplateField, value: any) => {
    if (value === undefined || value === null || value === '') {
      return <div className="text-sm text-gray-500">—</div>
    }
    switch (f.type) {
      case 'text':
      case 'textarea':
      case 'select':
        return <div className="text-sm">{String(value)}</div>
      case 'number':
        return <div className="text-sm">{value}</div>
      case 'date':
        return <div className="text-sm">{String(value)}</div>
      case 'chips':
        return (
          <div className="flex gap-1 flex-wrap">
            {(Array.isArray(value) ? value : []).map((v:string, i:number) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded border">{v}</span>
            ))}
          </div>
        )
      case 'images':
        return (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {(Array.isArray(value) ? value : []).map((url:string, i:number) => (
              <img key={i} src={url} alt="" className="w-full h-24 object-cover rounded border" />
            ))}
          </div>
        )
      case 'richtext':
        return (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: value || '' }}
          />
        )
      default:
        return <div className="text-sm">{String(value)}</div>
    }
  }

  const nonBuiltinFields = (template?.fields || []).filter(f => !f.builtin)

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-black/40 flex">
        <div className="ml-auto h-full w-full max-w-3xl bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-2">
            <h3 className="font-semibold">Personnage : {data.firstname} {data.lastname}</h3>
            <div className="ml-auto flex gap-2">
              {onEdit && <button className="btn-secondary" onClick={()=>onEdit(characterId)}>Éditer</button>}
              <button className="btn-primary" onClick={onClose}>Fermer</button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Natif */}
            <div className="flex items-center gap-4">
              <img
                src={data.avatarUrl || '/placeholder-avatar.svg'}
                className="w-16 h-16 rounded object-cover border"
                alt=""
              />
              <div className="text-sm text-gray-600 space-y-0.5">
                {data.age != null && (
                  <div>Âge : <span className="font-medium">{data.age}</span></div>
                )}
                {data.birthdate && (
                  <div>Naissance : <span className="font-medium">{data.birthdate}</span></div>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex gap-1 flex-wrap">
              {(data.tags || []).map((t:Tag) => (
                <span
                  key={t.id}
                  className="text-xs px-2 py-0.5 rounded border"
                  style={{
                    borderColor: t.color || '#e5e7eb',
                    backgroundColor: t.color ? t.color + '22' : undefined
                  }}
                  title={t.note || undefined}
                >
                  {t.name}
                </span>
              ))}
            </div>

            {/* Champs du template (non builtin) */}
            {!!nonBuiltinFields.length && (
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Détails</h4>
                <ul className="space-y-3">
                  {nonBuiltinFields.map((f) => (
                    <li key={f.id} className="border rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">{f.label}</div>
                      {renderField(f, (data.content || {})[f.id])}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
