import type { FC } from 'react'
import type { Project } from '../types/project'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiGet } from '../utils/fetcher'
import { ProjectHeader } from '../components/Project/Header'
import { ProjectMain } from '../components/Project/Main'
import { ProjectSidebar } from '../components/Project/Sidebar'
import type { SidebarSections } from '../types/sidebarSections'
import type { SelectedNode } from '../types/selectedNodes'

/**
 * Dashboard view for a single project.
 * Shows:
 *  • Global header with a back button
 *  • Left navigation rail (future‑proofed for additional tabs)
 *  • Hierarchy tree and rich text editor
 */
const ProjectDashboard: FC = () => {
  const { projectId } = useParams()
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [activeSection, setActiveSection] = useState<SidebarSections>('redaction')
  const [refreshTree, setRefreshTree] = useState<() => void>(() => {});

  // Load project metadata
  useEffect(() => {
    if (!projectId) return
    apiGet<Project>(`projects/${projectId}`)
      .then(setProject)
      .catch((err) => console.error('Failed to load project', err))
  }, [projectId])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <ProjectHeader projectName={project?.name ?? projectId} />

      <div className="flex grow overflow-hidden">
        <ProjectSidebar
          active={activeSection}
          setActive={setActiveSection}
          onSelectNode={setSelectedNode}
          onRefreshTree={setRefreshTree}
        />
        <ProjectMain selected={selectedNode} refreshTree={refreshTree} />
      </div>
    </div>
  )
}

export default ProjectDashboard