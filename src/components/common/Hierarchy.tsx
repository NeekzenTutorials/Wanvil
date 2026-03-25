// src/components/Hierarchy/Hierarchy.tsx
import type { FC } from 'react'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  ChevronDown, ChevronRight, Plus, Folder, Layers, Book, Search, ChevronsDown, ChevronsUp
} from 'lucide-react'

import type { HierarchyNode } from '../../types/hierarchyNode'
import { apiGet, apiPost } from '../../utils/fetcher'
import type { SelectedNode } from '../../types/selectedNodes'
import { useTranslation } from '../../i18n'

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
  const [data, setData] = useState<HierarchyNode[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchTree = useCallback(() => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    apiGet<HierarchyNode[]>(`projects/${projectId}/tree`)
      .then(setData)
      .catch((err) => setError(err))
      .finally(() => setLoading(false))
  }, [projectId])

  useEffect(() => {
    fetchTree()
  }, [fetchTree])

  return { data, loading, error, refresh: fetchTree }
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
interface HierarchyProps {
  onSelect: (node: SelectedNode) => void
  onRefreshReady?: (fn: () => void) => void
}

type Level = 'collection' | 'saga' | 'tome'

const STORAGE_KEY = (pid?: string) => `wv:tree:open:${pid || 'global'}`

const Hierarchy: FC<HierarchyProps> = ({ onSelect, onRefreshReady }) => {
  const { t } = useTranslation()
  const { projectId } = useParams()
  const { data: tree, loading, error, refresh } = useHierarchy(projectId)

  // expose refresh to parent
  const lastRef = useRef<() => void | null>(null)
  useEffect(() => {
    if (lastRef.current !== refresh) {
      lastRef.current = refresh
      onRefreshReady?.(refresh)
    }
  }, [refresh, onRefreshReady])

  // open-state persisted
  const [openSet, setOpenSet] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY(projectId))
      return new Set<string>(raw ? JSON.parse(raw) : [])
    } catch { return new Set() }
  })
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY(projectId), JSON.stringify(Array.from(openSet))) } catch {}
  }, [openSet, projectId])

  const toggleOpen = (id: string) =>
    setOpenSet(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const expandAll = () => {
    if (!tree) return
    const all = new Set<string>()
    const visit = (n: HierarchyNode) => { all.add(n.id); n.children?.forEach(visit) }
    tree.forEach(visit)
    setOpenSet(all)
  }
  const collapseAll = () => setOpenSet(new Set())

  // selection highlight (local)
  const [selectedId, setSelectedId] = useState<string>('')

  // filter
  const [q, setQ] = useState('')
  const filteredTree = useMemo(() => {
    if (!tree) return null
    const query = q.trim().toLowerCase()
    if (!query) return tree
    const filter = (nodes: HierarchyNode[]): HierarchyNode[] => nodes.map(n => {
      const match = n.title.toLowerCase().includes(query)
      const kids = n.children ? filter(n.children) : []
      return match || kids.length ? { ...n, children: kids } : null
    }).filter(Boolean) as HierarchyNode[]
    return filter(tree)
  }, [tree, q])

  /* Create a root Collection */
  const handleCreateRoot = async () => {
    const name = prompt('Nom de la nouvelle collection')?.trim()
    if (!name || !projectId) return
    await apiPost(`projects/${projectId}/collections`, { name })
    refresh()
  }

  if (loading) {
    return (
      <div className="px-2 py-2 space-y-2">
        <div className="h-9 bg-gray-200/60 dark:bg-gray-700/60 rounded animate-pulse" />
        <div className="h-9 bg-gray-200/60 dark:bg-gray-700/60 rounded animate-pulse" />
        <div className="h-9 bg-gray-200/60 dark:bg-gray-700/60 rounded animate-pulse" />
      </div>
    )
  }
  if (error) return <p className="text-sm text-red-500 px-2">Erreur : {error.message}</p>

  const treeToRender = filteredTree

  return (
    <div className="flex flex-col gap-3">
      {/* Top bar: search + expand/collapse */}
      <div className="px-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400 dark:text-gray-500" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-8 pr-2 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <button
          onClick={expandAll}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          title={t('hierarchy.expandAll')}
        >
          <ChevronsDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={collapseAll}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          title={t('hierarchy.collapseAll')}
        >
          <ChevronsUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Tree */}
      {!treeToRender || treeToRender.length === 0 ? (
        <div className="px-2 space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('hierarchy.noCollection')}</p>
          <button
            onClick={handleCreateRoot}
            className="inline-flex items-center gap-1 text-indigo-600 text-sm hover:underline"
          >
            <Plus className="w-4 h-4" /> {t('hierarchy.newCollection')}
          </button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            {treeToRender.map(node => (
              <TreeNode
                key={node.id}
                node={node}
                onSelect={(sel) => { setSelectedId(sel.id); onSelect(sel) }}
                openSet={openSet}
                toggleOpen={toggleOpen}
                refresh={refresh}
                projectId={projectId!}
                selectedId={selectedId}
              />
            ))}
          </div>

          <button
            onClick={handleCreateRoot}
            className="flex items-center gap-1 text-indigo-600 text-sm hover:underline mt-1 px-2"
          >
            <Plus className="w-4 h-4" /> {t('hierarchy.newCollection')}
          </button>
        </>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Recursive tree node                                                       */
/* -------------------------------------------------------------------------- */
const levelIcon = (lvl: Level) =>
  lvl === 'collection' ? <Folder className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> :
  lvl === 'saga'       ? <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" /> :
                         <Book   className="w-4 h-4 text-slate-600 dark:text-slate-400" />

const nextLevel = (lvl: Level): Level => (lvl === 'collection' ? 'saga' : 'tome')

const TreeNode: FC<{
  node: HierarchyNode
  onSelect: (node: SelectedNode) => void
  refresh: () => void
  projectId: string
  openSet: Set<string>
  toggleOpen: (id: string) => void
  selectedId: string
}> = ({ node, onSelect, refresh, projectId, openSet, toggleOpen, selectedId }) => { 
  const { t } = useTranslation() 
  const isOpen = openSet.has(node.id)
  const hasChildren = !!(node.children && node.children.length > 0)
  const isSelected = selectedId === node.id

  const createChild = async () => {
    const name = prompt(`Nom du ${nextLevel(node.level as Level)}`)?.trim()
    if (!name) return

    let endpoint = ''
    if (node.level === 'collection') endpoint = `collections/${node.id}/sagas`
    if (node.level === 'saga')       endpoint = `sagas/${node.id}/tomes`
    if (!endpoint) return

    await apiPost(endpoint, { name })
    refresh()
  }

  return (
    <div>
      <div
        className={`group relative mx-1 flex items-center gap-2 rounded-lg px-2 py-1.5
          ${isSelected ? 'bg-indigo-50 dark:bg-indigo-950 ring-1 ring-indigo-100 dark:ring-indigo-800' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
      >
        {/* Caret */}
        {hasChildren ? (
          <button
            onClick={() => toggleOpen(node.id)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
            aria-label={isOpen ? t('hierarchy.collapse') : t('hierarchy.expand')}
            title={isOpen ? t('hierarchy.collapse') : t('hierarchy.expand')}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-6" />
        )}

        {/* Icon */}
        <span className="shrink-0">{levelIcon(node.level as Level)}</span>

        {/* Title */}
        <button
          onClick={() => onSelect({ id: node.id, level: node.level as Level })}
          className="flex-1 text-left truncate"
          title={node.title}
        >
          <span className={`text-sm ${isSelected ? 'text-indigo-900 dark:text-indigo-300 font-medium' : 'text-gray-800 dark:text-gray-200'}`}>
            {node.title}
          </span>
        </button>

        {/* Badge children count */}
        {hasChildren && (
          <span className="text-[11px] leading-4 px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
            {node.children!.length}
          </span>
        )}

        {/* Add button (hover) */}
        {node.level !== 'tome' && (
          <button
            onClick={createChild}
            className="ml-1 p-1 rounded text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 opacity-0 group-hover:opacity-100 transition"
            title={node.level === 'collection' ? t('hierarchy.addSaga') : t('hierarchy.addTome')}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Left accent when selected */}
        {isSelected && <span className="absolute left-0 top-0 h-full w-0.5 bg-indigo-500 rounded-l" />}
      </div>

      {hasChildren && isOpen && (
        <div className="pl-5 ml-3 border-l border-gray-200 dark:border-gray-700 space-y-1">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              refresh={refresh}
              projectId={projectId}
              openSet={openSet}
              toggleOpen={toggleOpen}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Hierarchy
