// src/pages/ProjectDashboard.tsx
import type { FC, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react'
import type { Project } from '../types/project'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiGet } from '../utils/fetcher'
import { ProjectHeader } from '../components/Project/Header'
import { ProjectMain } from '../components/Project/Main'
import { ProjectSidebar } from '../components/Project/Sidebar'
import type { SidebarSections, CharactersSubView } from '../types/sidebarSections'
import type { SelectedNode } from '../types/selectedNodes'
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react'

const MIN_W = 240
const MAX_W = 520
const STORAGE_KEY = 'wv:sidebar:w'

const ProjectDashboard: FC = () => {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project | null>(null)

  const [activeSection, setActiveSection] = useState<SidebarSections>('redaction')
  const [charactersView, setCharactersView] = useState<CharactersSubView>('list')

  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [refreshTree, setRefreshTree] = useState<() => void>(() => {})

  const [collapsed, setCollapsed] = useState(false)
  

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <ProjectHeader projectName={project?.name ?? projectId ?? ''} />

      {/* Bouton burger visible en mobile */}
      <button
        className="md:hidden fixed z-40 left-3 top-16 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 shadow-sm border"
        onClick={() => setMobileOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-4 h-4" />
        <span className="text-sm">Menu</span>
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
            aria-label="Redimensionner la barre latérale"
            title="Glissez pour redimensionner"
          >
            <div className="absolute inset-y-0 left-[calc(50%-0.5px)] w-px bg-gray-200 group-hover:bg-indigo-400" />
            {/* Bouton "plier" (flèche) attaché au handle */}
            <button
              onClick={toggleCollapse}
              className="absolute -right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white border shadow hover:bg-gray-50"
              aria-label="Masquer la barre latérale"
              title="Masquer la barre latérale"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Bouton "déplier" quand plié (desktop/tablette uniquement) */}
        {collapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden md:flex fixed left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white border shadow hover:bg-gray-50"
            aria-label="Afficher la barre latérale"
            title="Afficher la barre latérale"
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
        />
      </div>
    </div>
  )
}

export default ProjectDashboard
