import { useEffect, useState } from 'react'
import { apiGet } from '../../utils/fetcher'
import { TemplateEditor } from './TemplateEditor'
import { useTranslation } from '../../i18n'

type Collection = { id: string; name: string }

export function CharactersTemplatePage({ projectId }: { projectId: string }) {
  const { t } = useTranslation()
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionId, setCollectionId] = useState<string | null>(null)

  useEffect(() => {
    apiGet<Collection[]>(`projects/${projectId}/collections`).then((cols) => {
      setCollections(cols)
      if (cols.length && !collectionId) setCollectionId(cols[0].id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600 dark:text-gray-400">{t('tags.collection')}</label>
        <select
          value={collectionId ?? ''}
          onChange={(e) => setCollectionId(e.target.value || null)}
          className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 dark:text-gray-100"
        >
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {collectionId ? (
        <TemplateEditor collectionId={collectionId} />
      ) : (
        <div className="text-gray-500 text-sm">Aucune collection disponible.</div>
      )}
    </div>
  )
}
