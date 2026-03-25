// src/pages/ProjectDashboard.tsx
import type { FC, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react'
import type { Project } from '../types/project'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiGet, apiPost, apiDelete } from '../utils/fetcher'
import { ProjectHeader } from '../components/Project/Header'
import { ProjectMain } from '../components/Project/Main'
import { ProjectSidebar } from '../components/Project/Sidebar'
import type { SidebarSections, CharactersSubView } from '../types/sidebarSections'
import type { SelectedNode } from '../types/selectedNodes'
import type { GameDesignComponent, GameDesignComponentRecord } from '../types/gameDesign'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '../i18n'

const MIN_W = 240
const MAX_W = 520
const STORAGE_KEY = 'wv:sidebar:w'

const ProjectDashboard: FC = () => {
  const { projectId } = useParams()
  const { t } = useTranslation()
  const [project, setProject] = useState<Project | null>(null)

  const [activeSection, setActiveSection] = useState<SidebarSections>('redaction')
  const [charactersView, setCharactersView] = useState<CharactersSubView>('list')

  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [refreshTree, setRefreshTree] = useState<() => void>(() => {})

  const [collapsed, setCollapsed] = useState(false)
  
  // Game Design state (API-backed)
  const [gdRecords, setGdRecords] = useState<GameDesignComponentRecord[]>([])
  const [activeGameDesignComponent, setActiveGameDesignComponent] = useState<GameDesignComponent | null>(null)
  const [pendingRemove, setPendingRemove] = useState<GameDesignComponent | null>(null)

  // largeur sidebar (persistée)
  const [sidebarW, setSidebarW] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    const n = raw ? parseInt(raw, 10) : 256
    return isNaN(n) ? 256 : Math.min(MAX_W, Math.max(MIN_W, n))
  })
  const [prevSidebarW, setPrevSidebarW] = useState<number>(sidebarW)
  useEffect(() => { localStorage.setItem(STORAGE_KEY, String(sidebarW)) }, [sidebarW])

  // drag state
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef(0)
  const startWRef = useRef(0)

  const toggleCollapse = () => {
    if (!collapsed) {
      setPrevSidebarW(sidebarW)       // mémorise la largeur actuelle
      setCollapsed(true)
    } else {
      setCollapsed(false)
      setSidebarW(prev => Math.max(MIN_W, prevSidebarW || 256))
    }
  }

  const beginDrag = (e: ReactMouseEvent | ReactTouchEvent) => {
    const x = 'touches' in e ? e.touches[0].clientX : (e as ReactMouseEvent).clientX
    startXRef.current = x
    startWRef.current = sidebarW
    setDragging(true)
    e.preventDefault()
  }

  useEffect(() => {
    if (collapsed && dragging) setDragging(false)
  }, [collapsed, dragging])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      const pointX = (e as TouchEvent).touches
        ? (e as TouchEvent).touches[0].clientX
        : (e as MouseEvent).clientX
      // Ne pas redimensionner en mode off-canvas mobile (on laisse 90vw)
      if (window.matchMedia('(max-width: 767.98px)').matches) return

      let next = startWRef.current + (pointX - startXRef.current)
      next = Math.max(MIN_W, Math.min(MAX_W, next))
      setSidebarW(next)
    }
    const end = () => {
      setDragging(false)
      document.body.style.cursor = ''
      document.body.classList.remove('select-none')
    }

    document.body.style.cursor = 'col-resize'
    document.body.classList.add('select-none')

    window.addEventListener('mousemove', onMove, { passive: false })
    window.addEventListener('mouseup', end)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', end)

    return () => {
      window.removeEventListener('mousemove', onMove as any)
      window.removeEventListener('mouseup', end)
      window.removeEventListener('touchmove', onMove as any)
      window.removeEventListener('touchend', end)
    }
  }, [dragging])

  // drawer mobile
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', mobileOpen) // bloque le scroll derrière le drawer
  }, [mobileOpen])

  // Load project metadata
  useEffect(() => {
    if (!projectId) return
    apiGet<Project>(`projects/${projectId}`)
      .then(setProject)
      .catch((err) => console.error('Failed to load project', err))
  }, [projectId])

  // Load game design components from API
  const loadGdComponents = useCallback(() => {
    if (!projectId) return
    apiGet<GameDesignComponentRecord[]>(`projects/${projectId}/game-design`)
      .then(setGdRecords)
      .catch(err => console.error('Failed to load GD components', err))
  }, [projectId])

  useEffect(() => { loadGdComponents() }, [loadGdComponents])

  const gameDesignComponents = gdRecords.map(r => r.componentType)

  const activeGdRecord = gdRecords.find(r => r.componentType === activeGameDesignComponent) ?? null

  const handleAddGameDesignComponent = useCallback((c: GameDesignComponent) => {
    if (!projectId) return
    apiPost<GameDesignComponentRecord>(`projects/${projectId}/game-design`, { componentType: c })
      .then(record => {
        setGdRecords(prev => [...prev, record])
        setActiveGameDesignComponent(c)
        setActiveSection('game-design')
      })
      .catch(err => console.error('Failed to add GD component', err))
  }, [projectId])

  const handleConfirmRemove = useCallback(() => {
    if (!projectId || !pendingRemove) return
    const rec = gdRecords.find(r => r.componentType === pendingRemove)
    if (!rec) { setPendingRemove(null); return }
    apiDelete(`projects/${projectId}/game-design/${rec.id}`)
      .then(() => {
        setGdRecords(prev => prev.filter(r => r.id !== rec.id))
        if (activeGameDesignComponent === pendingRemove) {
          setActiveGameDesignComponent(null)
          setActiveSection('redaction')
        }
        setPendingRemove(null)
      })
      .catch(err => { console.error('Failed to remove GD component', err); setPendingRemove(null) })
  }, [projectId, pendingRemove, gdRecords, activeGameDesignComponent])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <ProjectHeader projectName={project?.name ?? projectId ?? ''} />

      {/* Bouton burger visible en mobile */}
      <button
        className="md:hidden fixed z-40 left-3 top-16 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-sm border border-gray-200 dark:border-gray-700"
        onClick={() => setMobileOpen(true)}
        aria-label={t('dashboard.openMenu')}
      >
        <Menu className="w-4 h-4" />
        <span className="text-sm">{t('sidebar.menu')}</span>
      </button>

      {/* Overlay sombre en mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex grow overflow-hidden">
        {/* Sidebar — OFF-CANVAS en mobile, wrapper animé en md+ */}
        {/* Drawer mobile (inchangé) */}
        <ProjectSidebar
          active={activeSection}
          setActive={(s) => { setActiveSection(s); if (window.innerWidth < 768) setMobileOpen(false) }}
          charactersView={charactersView}
          setCharactersView={setCharactersView}
          onSelectNode={(node) => {
            setSelectedNode(node)
            setActiveSection('redaction')
            if (window.innerWidth < 768) setMobileOpen(false)
          }}
          onRefreshTree={setRefreshTree}
          onCloseMobile={() => setMobileOpen(false)}
          gameDesignComponents={gameDesignComponents}
          onShowCatalog={() => setActiveSection('game-design-catalog')}
          onRemoveGameDesignComponent={(c) => setPendingRemove(c)}
          onSelectGameDesignComponent={setActiveGameDesignComponent}
          activeGameDesignComponent={activeGameDesignComponent}
          /* Partie mobile : position fixe + translate (inchangée) */
          className={[
            'fixed inset-y-0 left-0 z-50 transform transition-transform md:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          ].join(' ')}
          style={{ width: Math.min(sidebarW, window.innerWidth * 0.9) }}
        />

        {/* Partie desktop/tablette (md+) : wrapper qui anime la largeur */}
        <div
          className="relative hidden md:block"
          style={{
            width: collapsed ? 0 : sidebarW,
            transition: 'width 160ms ease'
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <ProjectSidebar
              active={activeSection}
              setActive={setActiveSection}
              charactersView={charactersView}
              setCharactersView={setCharactersView}
              onSelectNode={(node) => { setSelectedNode(node); setActiveSection('redaction') }}
              onRefreshTree={setRefreshTree}
              gameDesignComponents={gameDesignComponents}
              onShowCatalog={() => setActiveSection('game-design-catalog')}
              onRemoveGameDesignComponent={(c) => setPendingRemove(c)}
              onSelectGameDesignComponent={setActiveGameDesignComponent}
              activeGameDesignComponent={activeGameDesignComponent}
              /* glisse le contenu quand on plie */
              className="h-full"
              style={{
                width: sidebarW,
                transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
                transition: 'transform 160ms ease'
              }}
            />
          </div>
        </div>

        {/* Handle de redimensionnement (md+) — masqué si plié */}
        {!collapsed && (
          <div
            className={`hidden md:block w-2 relative cursor-col-resize group ${dragging ? 'bg-indigo-200/50' : ''}`}
            onMouseDown={beginDrag}
            onTouchStart={beginDrag}
            role="separator"
            aria-orientation="vertical"
            aria-label={t('dashboard.resizeSidebar')}
            title={t('dashboard.resizeSidebar')}
          >
            <div className="absolute inset-y-0 left-[calc(50%-0.5px)] w-px bg-gray-200 dark:bg-gray-700 group-hover:bg-indigo-400" />
            {/* Bouton "plier" (flèche) attaché au handle */}
            <button
              onClick={toggleCollapse}
              className="absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow hover:bg-gray-50 dark:hover:bg-gray-700"
              aria-label={t('dashboard.hideSidebar')}
              title={t('dashboard.hideSidebar')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bouton "déplier" quand plié (desktop/tablette uniquement) */}
        {collapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden md:flex fixed left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label={t('dashboard.showSidebar')}
            title={t('dashboard.showSidebar')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Main */}
        <ProjectMain
          active={activeSection}
          charactersView={charactersView}
          selected={selectedNode}
          refreshTree={refreshTree}
          projectId={projectId || ''}
          activeGameDesignComponent={activeGameDesignComponent}
          activeGdRecordId={activeGdRecord?.id ?? null}
          enabledGdComponents={gameDesignComponents}
          onAddGameDesignComponent={handleAddGameDesignComponent}
        />
      </div>

      {/* Confirm delete modal for GD components */}
      <ConfirmModal
        open={pendingRemove !== null}
        title={t('dashboard.deleteComponent')}
        message={t('dashboard.deleteComponentMsg')}
        confirmLabel={t('common.delete')}
        onConfirm={handleConfirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </div>
  )
}

export default ProjectDashboard
