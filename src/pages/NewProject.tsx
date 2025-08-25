// src/pages/NewProject.tsx
import { useState, useMemo } from 'react'
import type { FC } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiPost } from '../utils/fetcher'
import { Rocket, Sparkles, Loader2, ArrowLeft } from 'lucide-react'

const MAX_LEN = 60

const adjectives = ['Écarlate', 'Indigo', 'Sauvage', 'Oublié', 'Brisé', 'Radieux', 'Silencieux', 'Éternel']
const nouns = ['Chroniques', 'Échos', 'Légendes', 'Ombres', 'Fragments', 'Aurores', 'Arcanes', 'Voyages']
const ofThings = ['du Nord', 'd’Aube', 'de Nacre', 'de Verre', 'de Braise', 'de Minuit', 'du Vent', 'du Rivage']

function makeSuggestion() {
  const a = adjectives[Math.floor(Math.random() * adjectives.length)]
  const n = nouns[Math.floor(Math.random() * nouns.length)]
  const o = ofThings[Math.floor(Math.random() * ofThings.length)]
  return `${n} ${a} ${o}`
}

const NewProject: FC = () => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(
    Array.from({ length: 3 }, makeSuggestion)
  )
  const navigate = useNavigate()

  const trimmed = useMemo(() => name.trim(), [name])
  const isValid = trimmed.length > 0 && trimmed.length <= MAX_LEN

  const refreshSuggestions = () => {
    setSuggestions(Array.from({ length: 3 }, makeSuggestion))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || loading) return
    setError(null)
    setLoading(true)
    try {
      const project = await apiPost<{ id: string }>('projects', { name: trimmed })
      navigate(`/project/${project.id}`)
    } catch (err: any) {
      setError(err?.message || 'Impossible de créer le projet.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Décor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 -left-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute top-24 -right-10 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
      </div>

      {/* Carte */}
      <div className="relative mx-auto w-full max-w-lg px-6">
        <div className="rounded-2xl border bg-white/90 backdrop-blur shadow-xl p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nouveau projet</h1>
              <p className="text-sm text-gray-500">Donnez un nom à votre univers pour commencer.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Champ nom */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Nom du projet</span>
              <input
                type="text"
                className="mt-2 block w-full rounded-xl border-gray-300 bg-white px-4 py-3 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, MAX_LEN))}
                placeholder="Ex. Chroniques indigo du Rivage"
                autoFocus
                required
                aria-invalid={!isValid}
                aria-describedby="helper-name"
              />
              <div id="helper-name" className="mt-1 flex items-center justify-between text-xs text-gray-500">
                <span>Vous pourrez tout modifier ensuite.</span>
                <span className={`${trimmed.length > MAX_LEN ? 'text-red-600' : 'text-gray-400'} tabular-nums`}>
                  {trimmed.length}/{MAX_LEN}
                </span>
              </div>
            </label>

            {/* Suggestions rapides */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Inspiration rapide</span>
                <button
                  type="button"
                  onClick={refreshSuggestions}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Regénérer
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setName(s)}
                    className="inline-flex items-center rounded-full border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    title="Utiliser cette suggestion"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Erreur API */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Link>

              <button
                type="submit"
                disabled={!isValid || loading}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-white shadow transition
                  ${!isValid || loading ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création…
                  </>
                ) : (
                  <>
                    Créer le projet
                    <Rocket className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Mini garanties / infos */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 text-center text-xs text-gray-500">
            <div className="rounded-lg border bg-white py-2">PWA installable</div>
            <div className="rounded-lg border bg-white py-2">Fonctionne hors-ligne</div>
            <div className="rounded-lg border bg-white py-2">Export PDF intégré</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewProject
