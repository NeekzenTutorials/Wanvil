// src/pages/OpenProject.tsx
import { useEffect, useMemo, useState } from 'react'
import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../utils/fetcher'
import type { Project } from '../types/project'
import {
  FolderOpen,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Star,
  StarOff,
  Calendar,
  Clock,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import { useTranslation } from '../i18n'

type SortKey = 'updated' | 'created' | 'alpha'

const OpenProject: FC = () => {
  const { t, lang } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('updated')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [pinned, setPinned] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pinnedProjects') || '[]') } catch { return [] }
  })

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await apiGet<Project[]>('projects')
      setProjects(data)
    } catch (err: any) {
      setError(err?.message || t('openProject.errorLoad'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    localStorage.setItem('pinnedProjects', JSON.stringify(pinned))
  }, [pinned])

  const togglePin = (id: string) => {
    setPinned((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const base = q
      ? projects.filter(p => p.name.toLowerCase().includes(q))
      : projects.slice()

    base.sort((a, b) => {
      if (sort === 'alpha') return a.name.localeCompare(b.name)
      const aDate = new Date((a.updatedAt ?? a.createdAt) || a.createdAt).getTime()
      const bDate = new Date((b.updatedAt ?? b.createdAt) || b.createdAt).getTime()
      if (sort === 'updated') return bDate - aDate
      // created
      const ac = new Date(a.createdAt).getTime()
      const bc = new Date(b.createdAt).getTime()
      return bc - ac
    })

    // Épinglés en tête
    base.sort((a, b) => {
      const pa = pinned.includes(a.id) ? 0 : 1
      const pb = pinned.includes(b.id) ? 0 : 1
      return pa - pb
    })

    return base
  }, [projects, query, sort, pinned])

  const fmtDate = (s?: string) =>
    s ? new Date(s).toLocaleDateString() : '—'

  const fmtRelative = (s?: string) => {
    if (!s) return '—'
    const d = new Date(s).getTime()
    const diffMs = d - Date.now()
    const abs = Math.abs(diffMs)
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
    const minute = 60_000, hour = 60 * minute, day = 24 * hour, week = 7 * day
    if (abs < hour) return rtf.format(Math.round(diffMs / minute), 'minute')
    if (abs < day)  return rtf.format(Math.round(diffMs / hour), 'hour')
    if (abs < week) return rtf.format(Math.round(diffMs / day), 'day')
    return rtf.format(Math.round(diffMs / week), 'week')
  }

  /* --------------------------- UI parts --------------------------- */

  const Toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
        <input
          className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 pl-9 pr-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-800"
          placeholder={t('openProject.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <select
        className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-gray-100 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-800"
        value={sort}
        onChange={(e) => setSort(e.target.value as SortKey)}
        title="Trier"
      >
        <option value="updated">{t('openProject.sortUpdated')}</option>
        <option value="created">{t('openProject.sortCreated')}</option>
        <option value="alpha">{t('openProject.sortAlpha')}</option>
      </select>

      <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setView('grid')}
          className={`px-3 py-2 ${view === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          title={t('openProject.grid')}
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setView('list')}
          className={`px-3 py-2 ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          title={t('openProject.list')}
        >
          <ListIcon className="h-4 w-4" />
        </button>
      </div>

      <Link
        to="/project/new"
        className="ml-auto inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" /> {t('openProject.newProject')}
      </Link>
    </div>
  )

  const SkeletonCard = () => (
    <div className="animate-pulse rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-600" />
      <div className="mt-3 h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-600" />
      <div className="mt-4 h-8 w-full rounded bg-gray-100 dark:bg-gray-700" />
    </div>
  )

  const ErrorBlock = (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex items-center justify-between">
        <span>{error}</span>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4" /> {t('common.retry')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen">
      {/* Backdrop */}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" />
      <div aria-hidden className="absolute -top-20 -left-10 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
      <div aria-hidden className="absolute top-40 -right-10 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" />
            {t('openProject.home')}
          </Link>
        </div>

        <header className="mb-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
              <FolderOpen className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('openProject.title')}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('openProject.subtitle')}</p>
            </div>
          </div>
        </header>

        {/* Toolbar */}
        <div className="mb-6">{Toolbar}</div>

        {/* States */}
        {loading ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        ) : error ? (
          ErrorBlock
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('openProject.empty')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('openProject.emptyDesc')}</p>
            <Link
              to="/project/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> {t('openProject.newProject')}
            </Link>
          </div>
        ) : (
          <>
            {/* GRID VIEW */}
            {view === 'grid' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((proj) => {
                  const last = proj.updatedAt ?? proj.createdAt
                  const isPinned = pinned.includes(proj.id)
                  return (
                    <div
                      key={proj.id}
                      className="group relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition hover:shadow-md"
                    >
                      {/* Bandeau haut discret */}
                      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-sky-500 opacity-60" />

                      <div className="mb-3 flex items-start gap-3">
                        <button
                          onClick={() => togglePin(proj.id)}
                          className="text-gray-400 hover:text-indigo-600 transition"
                          title={isPinned ? t('openProject.unpin') : t('openProject.pin')}
                        >
                          {isPinned ? <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" /> : <StarOff className="h-5 w-5" />}
                        </button>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{proj.name}</h3>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          {t('openProject.createdOn')} {fmtDate(proj.createdAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          {t('openProject.lastActivity')} {fmtRelative(last)}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <Link
                          to={`/project/${proj.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-black"
                        >
                          {t('common.open')} <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/project/${proj.id}`}
                          className="text-sm text-indigo-600 hover:underline"
                        >
                          {t('common.continue')}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* LIST VIEW */}
            {view === 'list' && (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 text-left">{t('openProject.project')}</th>
                      <th className="px-4 py-3 text-left">{t('openProject.creation')}</th>
                      <th className="px-4 py-3 text-left">{t('openProject.lastActivity')}</th>
                      <th className="px-4 py-3 text-right">{t('openProject.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const last = p.updatedAt ?? p.createdAt
                      const isPinned = pinned.includes(p.id)
                      return (
                        <tr key={p.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => togglePin(p.id)}
                                className="text-gray-400 hover:text-indigo-600"
                                title={isPinned ? t('openProject.unpin') : t('openProject.pin')}
                              >
                                {isPinned ? <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" /> : <StarOff className="h-4 w-4" />}
                              </button>
                              <div className="font-medium text-gray-900 dark:text-gray-100">{p.name}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtDate(p.createdAt)}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{fmtRelative(last)}</td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to={`/project/${p.id}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                            >
                              {t('common.open')} <ExternalLink className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                    {!filtered.length && (
                      <tr>
                        <td className="px-4 py-10 text-center text-gray-500" colSpan={4}>
                          {t('openProject.noMatch')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OpenProject
