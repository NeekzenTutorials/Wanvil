import { useEffect, useState } from 'react'
import { apiGet } from '../../utils/fetcher'
import ModalPortal from '../common/ModalPortal'

type Tag = { id:string; name:string; color?:string; note?:string }
type CustomField = { id:string; label:string; type:'text'|'textarea'|'number'|'date'|'richtext'; value:any }

export function ItemView({ itemId, onClose, onEdit }:{
  itemId: string
  onClose: () => void
  onEdit?: (id:string)=>void
}) {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    apiGet<any>(`items/${itemId}`).then(setData)
  }, [itemId])

  if (!data) return null

  const customFields: CustomField[] = data?.content?.customFields || []

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] bg-black/40 flex">
        <div className="ml-auto h-full w-full max-w-3xl bg-white flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center gap-2">
            <h3 className="font-semibold">Objet : {data.name}</h3>
            <div className="ml-auto flex gap-2">
              {onEdit && (
                <button className="btn-secondary" onClick={() => onEdit(itemId)}>
                  Éditer
                </button>
              )}
              <button className="btn-primary" onClick={onClose}>Fermer</button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Tags */}
            <div className="flex gap-1 flex-wrap">
              {(data.tags || []).map((t:Tag) => (
                <span key={t.id}
                      className="text-xs px-2 py-0.5 rounded border"
                      style={{ borderColor: t.color || '#e5e7eb', backgroundColor: t.color ? t.color + '22' : undefined }}
                      title={t.note || undefined}>
                  {t.name}
                </span>
              ))}
            </div>

            {/* Images */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {(data.images || []).map((url:string, i:number) => (
                <img key={i} src={url} alt="" className="w-full h-24 object-cover rounded border"/>
              ))}
              {!((data.images||[]).length) && <div className="text-sm text-gray-400">Aucune image.</div>}
            </div>

            {/* Description */}
            {data.description && (
              <section className="space-y-1">
                <h4 className="text-sm font-semibold text-gray-700">Description</h4>
                <div className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: data.description }} />
              </section>
            )}

            {/* Champs personnalisés */}
            {!!customFields.length && (
              <section className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Champs personnalisés</h4>
                <ul className="space-y-3">
                  {customFields.map((f) => (
                    <li key={f.id} className="border rounded-xl p-3">
                      <div className="text-xs text-gray-500 mb-1">{f.label}</div>
                      {f.type === 'richtext' ? (
                        <div className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: f.value || '' }} />
                      ) : (
                        <div className="text-sm">
                          {f.value === null || f.value === undefined || f.value === '' ? '—' : String(f.value)}
                        </div>
                      )}
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
