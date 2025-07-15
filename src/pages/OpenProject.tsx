import { useEffect, useState } from 'react'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../utils/fetcher'
import type { Project } from '../types/project'

const OpenProject: FC = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiGet<Project[]>('projects')
      .then(data => setProjects(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6 text-center">Chargement des projets...</div>
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-2xl font-bold mb-4">Ouvrir un projet</h2>
      {projects.length === 0 ? (
        <p className="text-gray-600">Aucun projet trouvé. <Link to="/project/new" className="text-blue-600 underline">Créez-en un</Link>.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map(proj => (
            <li key={proj.id}>
              <Link
                to={`/project/${proj.id}`}
                className="block p-4 bg-white rounded shadow hover:bg-blue-50 transition"
              >
                <h3 className="text-lg font-semibold text-gray-800">{proj.name}</h3>
                <p className="text-sm text-gray-500">Créé le {new Date(proj.createdAt).toLocaleDateString()}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default OpenProject