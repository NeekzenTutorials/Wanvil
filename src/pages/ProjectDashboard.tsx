import type { FC } from 'react'
import type { Project } from '../types/project'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiGet } from '../utils/fetcher'
import { ProjectHeader } from '../components/Project/Header'
import { ProjectMain } from '../components/Project/Main'
import { ProjectSidebar } from '../components/Project/Sidebar'
import type { SidebarSections, CharactersSubView } from '../types/sidebarSections'
import type { SelectedNode } from '../types/selectedNodes'

const ProjectDashboard: FC = () => {
  const { projectId } = useParams()
  const [project, setProject] = useState<Project | null>(null)

  const [activeSection, setActiveSection] = useState<SidebarSections>('redaction')
  const [charactersView, setCharactersView] = useState<CharactersSubView>('list')

  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [refreshTree, setRefreshTree] = useState<() => void>(() => {})

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

      <div className="flex grow overflow-hidden">
        <ProjectSidebar
          active={activeSection}
          setActive={setActiveSection}
          charactersView={charactersView}
          setCharactersView={setCharactersView}
          onSelectNode={(node) => {
            setSelectedNode(node)
            // si on était ailleurs, basculer sur "Rédaction" pour voir NodeDetails
            setActiveSection('redaction')
          }}
          onRefreshTree={setRefreshTree} // Hierarchy appellera onRefreshReady(fn) -> on stocke fn ici
        />

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
