import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'

import { apiGet, apiPut, apiDelete, apiPost } from '../../utils/fetcher'
import type { SelectedNode } from '../../types/selectedNodes'

interface NodeDetailsProps {
  selected: SelectedNode | null
  onRefreshHierarchy: () => void
}

export const NodeDetails = ({ selected, onRefreshHierarchy }: NodeDetailsProps) => {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')

  // ---------------------------------------------------------------------------
  // Load detail + children when selected changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!selected) return

    const { id, level } = selected
    setLoading(true)
    apiGet<{ name: string; sagas?: any[]; tomes?: any[] }>(`${level}s/${id}`)
      .then((d) => {
        setData(d)
        setName(d.name)
      })
      .finally(() => setLoading(false))
  }, [selected])

  // ---------------------------------------------------------------------------
  // Guards
  // ---------------------------------------------------------------------------
  if (!selected) return null
  if (loading || !data) return <p>Chargement…</p>

  // Children (sagas ou tomes)
  const childrenKey = selected.level === 'collection' ? 'sagas' : 'tomes'
  const children = (data?.[childrenKey] ?? []) as { id: string; name: string }[]

  // ---------------------------------------------------------------------------
  // CRUD actions
  // ---------------------------------------------------------------------------
  const save = async () => {
    await apiPut(`${selected.level}s/${selected.id}`, { name })
    onRefreshHierarchy()
  }

  const remove = async () => {
    if (!confirm('Supprimer définitivement ?')) return
    await apiDelete(`${selected.level}s/${selected.id}`)
    onRefreshHierarchy()
  }

  const createChild = async () => {
    const childName = prompt('Nom ?')?.trim()
    if (!childName) return

    let endpoint = ''
    if (selected.level === 'collection') endpoint = `collections/${selected.id}/sagas`
    else if (selected.level === 'saga') endpoint = `sagas/${selected.id}/tomes`

    await apiPost(endpoint, { name: childName })
    onRefreshHierarchy()
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ---- Edit name ------------------------------------------------------ */}
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <div className="flex gap-2">
        <button onClick={save} className="btn-primary">
          Enregistrer
        </button>
        <button onClick={remove} className="btn-danger ml-auto">
          Supprimer
        </button>
      </div>

      {/* ---- Children list -------------------------------------------------- */}
      {selected.level !== 'tome' && (
        <section>
          <h3 className="font-semibold mb-2">
            {selected.level === 'collection' ? 'Sagas' : 'Tomes'}
          </h3>

          {children.length ? (
            <ul className="list-disc ml-5 space-y-1 text-gray-800">
              {children.map((c) => (
                <li key={c.id}>{c.name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Aucun {childrenKey.slice(0, -1)}</p>
          )}

          <button
            onClick={createChild}
            className="text-indigo-600 flex items-center gap-1 mt-4 text-sm"
          >
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        </section>
      )}
    </div>
  )
}
