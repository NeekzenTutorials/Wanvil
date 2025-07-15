import type { FC } from 'react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Hierarchy from '../components/Hierarchy/Hierachy'
import Editor from '../components/Editor/Editor'

const ProjectDashboard: FC = () => {
  const { projectId } = useParams()
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar for hierarchy */}
      <aside className="w-64 bg-white shadow-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Structure</h3>
        <Hierarchy onSelect={setSelectedNode} />
      </aside>

      {/* Main Editor area */}
      <main className="flex-grow p-6">
        {selectedNode ? (
          <Editor nodeId={selectedNode} />
        ) : (
          <div className="text-gray-500">Choisissez un chapitre ou tome à éditer</div>
        )}
      </main>
    </div>
  )
}

export default ProjectDashboard