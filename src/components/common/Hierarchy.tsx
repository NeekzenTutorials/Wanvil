import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Plus } from 'lucide-react'

import type { HierarchyNode } from '../../types/hierarchyNode'
import { apiGet, apiPost } from '../../utils/fetcher'
import type { SelectedNode } from '../../types/selectedNodes'

/* -------------------------------------------------------------------------- */
/*  Custom hook : fetch + refresh                                             */
/* -------------------------------------------------------------------------- */
interface UseHierarchyResult {
  data: HierarchyNode[] | null
  loading: boolean
  error: Error | null
  refresh: () => void
}

function useHierarchy(projectId?: string): UseHierarchyResult {
  const [state, setState] = useState<Omit<UseHierarchyResult, 'refresh'>>({
    data: null,
    loading: false,
    error: null,
  })

  const fetchTree = () => {
    if (!projectId) return

    setState((s) => ({ ...s, loading: true, error: null }))
    apiGet<HierarchyNode[]>(`projects/${projectId}/tree`)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => setState({ data: null, loading: false, error: err }))
  }

  useEffect(fetchTree, [projectId])

  return { ...state, refresh: fetchTree }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
interface HierarchyProps {
  onSelect: (node: SelectedNode) => void
  onRefreshReady: (fn: () => void) => void
}

type Level = 'collection' | 'saga' | 'tome'

const Hierarchy: FC<HierarchyProps> = ({ onSelect }) => {
  const { projectId } = useParams()
  const { data: tree, loading, error, refresh } = useHierarchy(projectId)

  function onRefreshReady(arg0: () => void) {
    console.log('Hierarchy ready for refresh');
  }

  useEffect(() => {
    onRefreshReady(() => refresh());
  }, [refresh, onRefreshReady]);

  /* Create a root Collection */
  const handleCreateRoot = async () => {
    const name = prompt('Nom de la nouvelle collection')?.trim()
    if (!name || !projectId) return
    await apiPost(`projects/${projectId}/collections`, { name })
    refresh()
  }

  if (loading) return <p className="text-sm text-gray-500 px-2">Chargement…</p>
  if (error) return <p className="text-sm text-red-500 px-2">Erreur : {error.message}</p>
  if (!tree || tree.length === 0)
    return (
      <div className="px-2 space-y-2">
        <p className="text-sm text-gray-500">Aucune collection</p>
        <button
          onClick={handleCreateRoot}
          className="inline-flex items-center gap-1 text-indigo-600 text-sm hover:underline"
        >
          <Plus className="w-4 h-4" /> Nouvelle collection
        </button>
      </div>
    )

  return (
    <div className="flex flex-col gap-2">
      {tree.map((node) => (
        <TreeNode key={node.id} node={node} onSelect={onSelect} refresh={refresh} projectId={projectId!} />
      ))}
      <button
        onClick={handleCreateRoot}
        className="flex items-center gap-1 text-indigo-600 text-sm hover:underline mt-2 px-1"
      >
        <Plus className="w-4 h-4" /> Nouvelle collection
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Recursive tree node                                                       */
/* -------------------------------------------------------------------------- */
const TreeNode: FC<{
  node: HierarchyNode
  onSelect: (node: SelectedNode) => void
  refresh: () => void
  projectId: string
}> = ({ node, onSelect, refresh, projectId }) => {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  const createChild = async () => {
    const name = prompt(`Nom du ${nextLevel(node.level)}`)?.trim()
    if (!name) return

    let endpoint: string
    switch (node.level) {
      case 'collection':
        endpoint = `collections/${node.id}/sagas`
        break
      case 'saga':
        endpoint = `sagas/${node.id}/tomes`
        break
      default:
        return
    }

    await apiPost(endpoint, { name })
    refresh()
    setOpen(true)
  }

  return (
    <div>
      <div className="flex items-center gap-1 group">
        {hasChildren ? (
          <button onClick={() => setOpen(!open)} className="p-1 text-gray-500 rounded hover:bg-gray-100">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-4 h-4" />)
        }

        <button onClick={() => onSelect({ id: node.id, level: node.level })} className="flex-1 text-left py-1 px-1 rounded hover:bg-gray-100">
          {node.title}
        </button>

        {node.level !== 'tome' && (
          <button onClick={createChild} className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-indigo-600 rounded">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div className="pl-5 border-l border-gray-200 mt-1 space-y-1">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} onSelect={onSelect} refresh={refresh} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
const nextLevel = (lvl: Level): Level => (lvl === 'collection' ? 'saga' : 'tome')

export default Hierarchy


