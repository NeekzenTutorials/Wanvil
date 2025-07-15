import { useState } from 'react'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../utils/fetcher'

const NewProject: FC = () => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const project = await apiPost<{id: string}>('projects', { name })
      navigate(`/project/${project.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Créer un nouveau projet</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <label className="block mb-2">
          <span className="text-gray-700">Nom du projet</span>
          <input
            type="text"
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Création...' : 'Créer'}
        </button>
      </form>
    </div>
  )
}

export default NewProject