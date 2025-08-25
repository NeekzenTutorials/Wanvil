import { useEffect, useMemo, useState } from 'react'
import { apiGet } from '../../utils/fetcher'
import {
  Loader2, RefreshCw, Download, SlidersHorizontal
} from 'lucide-react'

type Collection = { id:string; name:string }
type Saga = { id:string; name:string }
type Tome = { id:string; name:string }
type ChapterMeta = { id:string; title:string; position?:number }
type ChapterFull = ChapterMeta & { content:string }
type EntityType = 'character'|'place'|'item'|'event'

type ChapterRow = {
  collectionId:string
  sagaId:string
  tomeId:string
  tomeName:string
  chapterId:string
  chapterTitle:string
  position?:number
  wordCount:number
  entities:{ id:string; type:EntityType; label:string; count:number }[]
  _html?: string
}

/* -------------------- Stopwords & utils texte -------------------- */
const STOPWORDS_FR = new Set([
  'a','à','â','afin','ai','aie','aient','ainsi','ait','alors','après','assez','au','aucun','aucune','aujourd','aujourd’hui','aupres','auquel','aura','aurai','auraient','aurais','aurait','auras','aurez','auriez','aurions','aurons','auront','aussi','autre','autres','aux','auxquelles','auxquels','avaient','avais','avait','avant','avec','avez','aviez','avions','avoir','avons','ayant','ayez','ayons',
  'car','ce','ceci','cela','celle','celles','celui','cependant','certain','certaine','certaines','certains','ces','cet','cette','ceux','chacun','chaque','chez','ci','comme','comment','contre','d','dans','de','des','du','dedans','dehors','depuis','devant','doit','doivent','donc','dont','dos','droite','début','désormais',
  'elle','elles','en','encore','ensuite','entre','envers','environ','est','et','etaient','etais','etait','etant','ete','etes','etre','eux',
  'fait','faite','faites','fois','font','furent','fut',
  'grande','grandes','grand','grands','haut','hors','ici','il','ils','je','jusqu','juste',
  'l','la','le','les','leur','leurs','là','lequel','lesquels','lesquelles','lors','lui',
  'ma','mais','mal','me','meme','mes','mien','mienne','miennes','miens','moi','moins','mon',
  'ne','ni','nommés','nos','notre','nous','nouveaux','on','ont','ou','où',
  'par','parce','parole','pas','pendant','personne','peu','peut','peuvent','peux','plus','plusieurs','plutôt','pour','pourquoi',
  'pourra','pourrais','pourrait','pourrez','pourrions','pourront','près','puis','puisque',
  'qu','quand','que','quel','quelle','quelles','quels','qui','quoi',
  'sa','sans','se','sera','serai','seraient','serais','serait','seras','serez','seriez','serions','serons','seront','ses','seulement',
  'si','sien','sienne','siennes','siens','soi','soit','sommes','son','sont','sous','souvent','sur',
  'ta','tandis','tel','telle','telles','tels','tes','toi','ton','tous','tout','toute','toutes','trois','trop','très','tu',
  'un','une','unes','uns','voici','voilà','vos','votre','vous','y'
])

function htmlToText(html:string):string {
  const doc = new DOMParser().parseFromString(`<div>${html||''}</div>`, 'text/html')
  return (doc.body?.textContent || '').replace(/\s+/g, ' ').trim()
}
function countWords(text:string):number {
  if (!text) return 0
  const tokens = text.toLowerCase().match(/[\p{L}\p{N}’']+/gu) || []
  return tokens.length
}
function topWords(htmls:string[], limit=20){
  const freq: Record<string,number> = {}
  for (const html of htmls) {
    const text = htmlToText(html).toLowerCase()
    const tokens = text.match(/[\p{L}\p{N}’']+/gu) || []
    for (const t of tokens) {
      if (t.length < 3) continue
      if (STOPWORDS_FR.has(t)) continue
      freq[t] = (freq[t] || 0) + 1
    }
  }
  return Object.entries(freq)
    .sort((a,b)=> b[1]-a[1])
    .slice(0, limit)
    .map(([label, value]) => ({ label, value }))
}
function parseEntities(html:string){
  const res: { id:string; type:EntityType; label:string }[] = []
  try {
    const doc = new DOMParser().parseFromString(`<div>${html||''}</div>`, 'text/html')
    const spans = Array.from(doc.querySelectorAll('span.wv-entity')) as HTMLElement[]
    for (const el of spans) {
      const type = (el.getAttribute('data-entity-type') || '') as EntityType
      const id   = el.getAttribute('data-entity-id') || ''
      const label = (el.textContent || '').trim()
      if (type && id) res.push({ id, type, label })
    }
  } catch {}
  return res
}
function groupCounts<T extends string>(arr:T[]){
  const m = new Map<T, number>()
  for (const x of arr) m.set(x, (m.get(x)||0)+1)
  return m
}

/* -------------------- UI Helpers -------------------- */
const MetricCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 border">
    <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
    <div className="text-2xl font-semibold">{value}</div>
    {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
  </div>
)

/* ---------- Charts ---------- */
type BarDatum = { label:string; value:number; color?:string }
function BarChart({
  data, height=190, unit='', max, showValues=false, labelAngle=0, color='#6366f1'
}:{
  data: BarDatum[]; height?: number; unit?: string; max?: number; showValues?: boolean; labelAngle?: number; color?: string
}) {
  const H = height
  const LM = 34
  const BM = 22
  const W  = Math.max(560, data.length*36)
  const innerH = H - BM - 8
  const maxVal = max ?? Math.max(1, ...data.map(d=>d.value))
  const ticks = 4
  const tickVals = Array.from({length:ticks+1}, (_,i)=> Math.round(i*maxVal/ticks))
  const barW = Math.max(10, Math.floor((W - LM) / (data.length*1.6)))
  const gap  = Math.max(10, Math.floor(barW*0.6))
  const showInlineValues = showValues && data.length <= 24
  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} role="img" aria-label="Bar chart">
        <g transform={`translate(${LM}, 8)`}>
          {tickVals.map((tv, i) => {
            const y = Math.round(innerH - (tv/Math.max(1,maxVal))*innerH)
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={W-LM-8} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x={-6} y={y+3} textAnchor="end" fontSize="10" fill="#6b7280">{tv.toLocaleString()}</text>
              </g>
            )
          })}
          {data.map((d, i) => {
            const h = Math.round((d.value / Math.max(1,maxVal)) * innerH)
            const x = i*(barW+gap)
            const y = innerH - h
            const fill = d.color || color
            return (
              <g key={d.label} transform={`translate(${x} ${y})`}>
                <rect width={barW} height={h} rx="5" fill={fill} opacity="0.9">
                  <title>{d.label}: {d.value.toLocaleString()} {unit}</title>
                </rect>
                {showInlineValues && h > 16 && (
                  <text x={barW/2} y={12} textAnchor="middle" fontSize="10" fill="white" fontWeight={600}>
                    {d.value.toLocaleString()}
                  </text>
                )}
                <g transform={`translate(${barW/2} ${h + 12})`}>
                  <text textAnchor="middle" fontSize="10" fill="#6b7280"
                        transform={labelAngle ? `rotate(${labelAngle})` : undefined}>
                    {d.label}
                  </text>
                </g>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

/* Courbe simple (progression cumulée) */
type LinePoint = { label:string; value:number }
function LineChart({
  data, height=180, color='#0ea5e9', unit=''
}:{ data: LinePoint[]; height?:number; color?:string; unit?:string }) {
  const H = height
  const LM = 34
  const BM = 22
  const W  = Math.max(560, data.length*28)
  const innerH = H - BM - 8
  const maxVal = Math.max(1, ...data.map(d=>d.value))
  const minVal = Math.min(0, ...data.map(d=>d.value))
  const range = Math.max(1, maxVal - minVal)
  const xStep = (W - LM - 8) / Math.max(1, data.length - 1)

  const yFor = (v:number) => innerH - ((v - minVal) / range) * innerH
  const xFor = (i:number) => i * xStep

  const path = data.map((d, i) => `${i ? 'L' : 'M'} ${xFor(i)} ${yFor(d.value)}`).join(' ')
  const area = `M 0 ${innerH} ${path} L ${xFor(data.length-1)} ${innerH} Z`

  const ticks = 4
  const tickVals = Array.from({length:ticks+1}, (_,i)=> Math.round(minVal + i*range/ticks))

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} role="img" aria-label="Line chart">
        <g transform={`translate(${LM}, 8)`}>
          {tickVals.map((tv, i) => {
            const y = Math.round(yFor(tv))
            return (
              <g key={i}>
                <line x1={0} y1={y} x2={W-LM-8} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                <text x={-6} y={y+3} textAnchor="end" fontSize="10" fill="#6b7280">{tv.toLocaleString()}</text>
              </g>
            )
          })}
          <path d={area} fill={color} opacity="0.12" />
          <path d={path} fill="none" stroke={color} strokeWidth="2.5" />
          {/* points cliquables + labels clairsemés */}
          {data.map((d,i)=>(
            <g key={i} transform={`translate(${xFor(i)} ${yFor(d.value)})`}>
              <circle r="2.5" fill={color} />
              {(i % Math.ceil(data.length/10) === 0) && (
                <text y={14} textAnchor="middle" fontSize="10" fill="#6b7280">{d.label}</text>
              )}
              <title>{d.label}: {d.value.toLocaleString()} {unit}</title>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

/* -------------------------- Palette -------------------------- */
const COL = {
  indigo:  '#6366f1',
  slate:   '#475569',
  emerald: '#10b981',
  amber:   '#f59e0b',
  violet:  '#8b5cf6',
  rose:    '#f43f5e',
  sky:     '#0ea5e9'
}

/* -------------------------- Page -------------------------- */
export function AnalyticsPage({ projectId }:{ projectId:string }) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionId, setCollectionId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ChapterRow[]>([])
  const [error, setError] = useState<string>('')

  // UI state
  const [activeTab, setActiveTab] = useState<'overview'|'entities'|'vocab'|'chapters'>('overview')
  const [tomeFilter, setTomeFilter] = useState<string>('') // '' => tous
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'position'|'wordCount'|'title'>('position')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [vocabLimit, setVocabLimit] = useState(24)

  // Charger les collections + auto-sélection de la première
  useEffect(() => {
    apiGet<Collection[]>(`projects/${projectId}/collections`).then((list) => {
      setCollections(list)
      if (list.length && !collectionId) setCollectionId(list[0].id)
    })
  }, [projectId]) // eslint-disable-line

  // Recalcul AUTOMATIQUE quand on choisit une collection
  useEffect(() => { if (collectionId) load(collectionId) }, [collectionId])

  const fmtShort = (n:number) => n >= 1_000_000 ? (n/1_000_000).toFixed(n%1_000_000?1:0)+'M'
                      : n >= 1_000 ? (n/1_000).toFixed(n%1_000?1:0)+'k'
                      : n.toString()

  const buildHistogram = (values:number[], bins?:number) => {
    const n = values.length
    if (!n) return [] as {label:string; value:number}[]
    const min = Math.min(...values)
    const max = Math.max(...values)
    if (min === max) return [{ label: fmtShort(min), value: n }]
    const b = bins ?? Math.min(14, Math.max(6, Math.round(Math.sqrt(n))))
    const width = (max - min) / b || 1
    const counts = new Array(b).fill(0)
    for (const v of values) {
      const idx = Math.min(b - 1, Math.floor((v - min) / width))
      counts[idx]++
    }
    return counts.map((c, i) => {
      const start = Math.round(min + i * width)
      const end   = Math.round(min + (i + 1) * width)
      return { label: `${fmtShort(start)}–${fmtShort(end)}`, value: c }
    })
  }

  // Recalcul manuel (bouton)
  const load = async (cid:string) => {
    if (!cid) return
    setError('')
    setLoading(true)
    try {
      const sagas = await apiGet<Saga[]>(`collections/${cid}/sagas`)
      const allTomes: Tome[] = (await Promise.all(sagas.map(s => apiGet<Tome[]>(`sagas/${s.id}/tomes`)))).flat()
      const tomeWithChapters = await Promise.all(allTomes.map(async (t) => {
        const td = await apiGet<{ id:string; name:string; chapters:ChapterMeta[] }>(`tomes/${t.id}`)
        return { tome: t, chapters: td.chapters || [], tomeName: td.name }
      }))

      // fetch chapitres en petits lots
      const limit = 8
      const chunks: ChapterMeta[][] = []
      const allMeta = tomeWithChapters.flatMap(x => x.chapters)
      for (let i=0; i<allMeta.length; i+=limit) chunks.push(allMeta.slice(i,i+limit))

      const metaToFull = new Map<string, ChapterFull>()
      for (const chunk of chunks) {
        const data = await Promise.all(chunk.map(m => apiGet<ChapterFull>(`chapters/${m.id}`)))
        for (const ch of data) metaToFull.set(ch.id, ch)
      }

      const out: ChapterRow[] = []
      for (const twc of tomeWithChapters) {
        for (const ch of twc.chapters) {
          const full = metaToFull.get(ch.id)
          const html = full?.content || ''
          const text = htmlToText(html)
          const wordCount = countWords(text)
          const ents = parseEntities(html)

          const counter = groupCounts(ents.map(e => `${e.type}:${e.id}`))
          const byEntity = Array.from(counter.entries()).map(([k, count]) => {
            const [type, id] = k.split(':') as [EntityType,string]
            const anyLabel = ents.find(e => e.id === id && e.type === type)?.label || id
            return { id, type, label: anyLabel, count }
          })

          out.push({
            collectionId: cid,
            sagaId: '',
            tomeId: twc.tome.id,
            tomeName: twc.tomeName || '',
            chapterId: ch.id,
            chapterTitle: full?.title || ch.title,
            position: ch.position,
            wordCount,
            entities: byEntity.sort((a,b)=> b.count - a.count || a.label.localeCompare(b.label)),
            _html: html,
          })
        }
      }

      out.sort((a,b) => a.tomeName.localeCompare(b.tomeName) || (a.position||0) - (b.position||0))
      setRows(out)
      setTomeFilter('') // reset filtre tome à chaque collection
    } catch (e:any) {
      setError(e?.message || 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }

  /* --------------------- Scope (filtre tome) --------------------- */
  const perTomeRaw = useMemo(() => {
    const map = new Map<string,{ tomeName:string; words:number; chapters:number }>()
    for (const r of rows) {
      const cur = map.get(r.tomeId) || { tomeName:r.tomeName, words:0, chapters:0 }
      cur.words += r.wordCount; cur.chapters++
      map.set(r.tomeId, cur)
    }
    return Array.from(map.entries()).map(([tomeId, v]) => ({ tomeId, ...v }))
      .sort((a,b)=> a.tomeName.localeCompare(b.tomeName))
  }, [rows])

  const scopedRows = useMemo(
    () => tomeFilter ? rows.filter(r => r.tomeId === tomeFilter) : rows,
    [rows, tomeFilter]
  )

  /* --------------------- Agrégations & graphiques --------------------- */
  const totalWords = useMemo(() => scopedRows.reduce((s,r)=>s+r.wordCount,0), [scopedRows])
  const totalChapters = scopedRows.length

  const perTome = useMemo(() => {
    if (!tomeFilter) return perTomeRaw
    // si scope sur un tome précis, on garde quand même sa carte "Mots par tome" (utile)
    return perTomeRaw.filter(t => t.tomeId === tomeFilter)
  }, [perTomeRaw, tomeFilter])

  const histogramData = useMemo(
    () => buildHistogram(scopedRows.map(r => r.wordCount)),
    [scopedRows]
  )

  const cumulative = useMemo<LinePoint[]>(() => {
    let acc = 0
    return scopedRows.map(r => {
      acc += r.wordCount
      const label = (r.position ? `#${r.position}` : r.chapterTitle.slice(0,10))
      return { label, value: acc }
    })
  }, [scopedRows])

  const topWordsScoped = useMemo(
    () => topWords(scopedRows.map(r => r._html || ''), vocabLimit),
    [scopedRows, vocabLimit]
  )

  function topEntities(type:EntityType, limit=12, src=scopedRows) {
    const counter = new Map<string,{ id:string; label:string; value:number }>()
    for (const r of src) {
      for (const e of r.entities) {
        if (e.type !== type) continue
        const c = counter.get(e.id) || { id:e.id, label:e.label, value:0 }
        c.value += e.count
        counter.set(e.id, c)
      }
    }
    return Array.from(counter.values()).sort((a,b)=> b.value - a.value).slice(0, limit)
  }

  /* --------------------- Table chapitres (tri + filtre) --------------------- */
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = scopedRows.filter(r =>
      !q || r.chapterTitle.toLowerCase().includes(q) || r.tomeName.toLowerCase().includes(q)
    )
    const dir = (sortDir === 'asc' ? 1 : -1)
    base.sort((a,b) => {
      if (sortKey === 'position') return dir * (((a.position||0)-(b.position||0)) || a.chapterTitle.localeCompare(b.chapterTitle))
      if (sortKey === 'wordCount') return dir * ((a.wordCount)-(b.wordCount))
      return dir * a.chapterTitle.localeCompare(b.chapterTitle)
    })
    return base
  }, [scopedRows, search, sortKey, sortDir])

  /* --------------------- Export CSV --------------------- */
  const exportCSV = () => {
    const rowsToExport = scopedRows
    const header = ['tome','chapitre','position','mots']
    const escape = (s:string)=> `"${(s||'').replace(/"/g,'""')}"`
    const body = rowsToExport.map(r => [
      escape(r.tomeName), escape(r.chapterTitle), r.position ?? '', r.wordCount
    ].join(',')).join('\n')
    const csv = header.join(',') + '\n' + body
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_${collectionId}${tomeFilter ? '_'+perTomeRaw.find(t=>t.tomeId===tomeFilter)?.tomeName : ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* --------------------- UI --------------------- */
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Analytics</h1>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select
            className="border rounded-lg px-3 py-2"
            value={collectionId}
            onChange={(e)=> { setCollectionId(e.target.value); setRows([]); }}
          >
            <option value="">Choisir une collection</option>
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            className="border rounded-lg px-3 py-2"
            value={tomeFilter}
            onChange={(e)=> setTomeFilter(e.target.value)}
            disabled={!rows.length}
            title="Filtrer par tome"
          >
            <option value="">Tous les tomes</option>
            {perTomeRaw.map(t => <option key={t.tomeId} value={t.tomeId}>{t.tomeName}</option>)}
          </select>

          <button
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => collectionId && load(collectionId)}
            disabled={!collectionId || loading}
            title="Recalculer maintenant"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Recalculer
          </button>

          <button
            className="inline-flex items-center gap-2 border rounded-lg px-3 py-2 hover:bg-gray-50"
            onClick={exportCSV}
            disabled={!rows.length}
            title="Exporter CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </header>

      {!collectionId ? (
        <p className="text-sm text-gray-500">Sélectionnez une collection pour afficher ses métriques.</p>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : rows.length === 0 && loading ? (
        <p className="text-sm text-gray-500">Calcul en cours…</p>
      ) : (
        <>
          {/* SEGMENTED TABS */}
          <div className="inline-flex rounded-xl border bg-white shadow-sm overflow-hidden">
            {[
              {k:'overview',  label:'Aperçu'},
              {k:'entities',  label:'Entités'},
              {k:'vocab',     label:'Vocabulaire'},
              {k:'chapters',  label:'Chapitres'},
            ].map(t => (
              <button
                key={t.k}
                onClick={() => setActiveTab(t.k as any)}
                className={`px-4 py-2 text-sm ${activeTab===t.k ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* --------- APERÇU --------- */}
          {activeTab === 'overview' && (
            <>
              {/* METRICS */}
              <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Chapitres" value={totalChapters.toString()} sub={tomeFilter ? 'dans ce tome' : undefined}/>
                <MetricCard label="Mots (total)" value={totalWords.toLocaleString()} />
                <MetricCard
                  label="Mots / chapitre"
                  value={totalChapters ? Math.round(totalWords/totalChapters).toLocaleString() : '—'}
                />
                <MetricCard
                  label="Tomes"
                  value={perTomeRaw.length.toString()}
                  sub={tomeFilter ? perTomeRaw.find(t=>t.tomeId===tomeFilter)?.tomeName : 'répartition ci-dessous'}
                />
              </section>

              {/* CHARTS */}
              <section className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                <div className="border rounded-xl bg-white shadow-sm p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Progression cumulée (mots)
                  </div>
                  {cumulative.length ? (
                    <LineChart data={cumulative} color={COL.sky} unit="mots" />
                  ) : (
                    <p className="text-sm text-gray-500">Aucune donnée.</p>
                  )}
                </div>

                <div className="border rounded-xl bg-white shadow-sm p-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Distribution des longueurs de chapitres
                  </div>
                  <BarChart
                    data={histogramData.map(d => ({ ...d, color: COL.indigo }))}
                    unit="chapitres"
                    showValues={histogramData.length <= 20}
                    color={COL.indigo}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Chaque barre indique le <em>nombre de chapitres</em> dont le nombre de mots
                    est dans l’intervalle indiqué.
                  </p>
                </div>

                <div className="border rounded-xl bg-white shadow-sm p-4 xl:col-span-2">
                  <div className="text-sm font-medium text-gray-700 mb-2">Mots par tome</div>
                  <BarChart
                    data={perTome.map(t => ({ label: t.tomeName, value: t.words, color: COL.slate }))}
                    unit="mots"
                    showValues={perTome.length <= 16}
                    color={COL.slate}
                  />
                </div>
              </section>
            </>
          )}

          {/* --------- ENTITÉS --------- */}
          {activeTab === 'entities' && (
            <section className="grid gap-6 grid-cols-1 xl:grid-cols-2">
              <div className="border rounded-xl bg-white shadow-sm p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Personnages les plus mentionnés</div>
                <BarChart
                  data={topEntities('character').map(x => ({ label:x.label, value:x.value, color: COL.rose }))}
                  unit="mentions"
                  showValues
                  color={COL.rose}
                />
              </div>

              <div className="border rounded-xl bg-white shadow-sm p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Lieux les plus mentionnés</div>
                <BarChart
                  data={topEntities('place').map(x => ({ label:x.label, value:x.value, color: COL.emerald }))}
                  unit="mentions"
                  showValues
                  color={COL.emerald}
                />
              </div>

              <div className="border rounded-xl bg-white shadow-sm p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Objets les plus mentionnés</div>
                <BarChart
                  data={topEntities('item').map(x => ({ label:x.label, value:x.value, color: COL.amber }))}
                  unit="mentions"
                  showValues
                  color={COL.amber}
                />
              </div>

              <div className="border rounded-xl bg-white shadow-sm p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Évènements les plus mentionnés</div>
                <BarChart
                  data={topEntities('event').map(x => ({ label:x.label, value:x.value, color: COL.violet }))}
                  unit="mentions"
                  showValues
                  color={COL.violet}
                />
              </div>
            </section>
          )}

          {/* --------- VOCABULAIRE --------- */}
          {activeTab === 'vocab' && (
            <section className="border rounded-xl bg-white shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">Mots les plus utilisés (stopwords FR exclus)</div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <SlidersHorizontal className="w-4 h-4" />
                  <label className="flex items-center gap-2">
                    Limite :
                    <input type="range" min={10} max={100} step={2}
                           value={vocabLimit}
                           onChange={e => setVocabLimit(parseInt(e.target.value))}
                    />
                    <span className="tabular-nums w-10 text-right">{vocabLimit}</span>
                  </label>
                </div>
              </div>
              {topWordsScoped.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {topWordsScoped.map(w => (
                    <div key={w.label} className="flex items-center justify-between border rounded px-2 py-1 text-sm bg-white">
                      <span className="truncate">{w.label}</span>
                      <span className="text-gray-500 tabular-nums">{w.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucune donnée disponible.</p>
              )}
            </section>
          )}

          {/* --------- CHAPITRES (table) --------- */}
          {activeTab === 'chapters' && (
            <section className="border rounded-xl bg-white shadow-sm">
              <div className="p-4 flex flex-wrap items-center gap-3">
                <div className="text-sm font-medium">Détails par chapitre</div>
                <input
                  className="ml-auto border rounded px-3 py-2 text-sm"
                  placeholder="Filtrer par titre ou tome…"
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                />
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={sortKey}
                  onChange={e=>setSortKey(e.target.value as any)}
                >
                  <option value="position">Tri&nbsp;: Position</option>
                  <option value="wordCount">Tri&nbsp;: Mots</option>
                  <option value="title">Tri&nbsp;: Titre</option>
                </select>
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={sortDir}
                  onChange={e=>setSortDir(e.target.value as any)}
                >
                  <option value="asc">Ascendant</option>
                  <option value="desc">Descendant</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-y">
                      <th className="px-4 py-2">Tome</th>
                      <th className="px-4 py-2">Chapitre</th>
                      <th className="px-4 py-2 text-right">Mots</th>
                      <th className="px-4 py-2">Top entités</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map(r => (
                      <tr key={r.chapterId} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">{r.tomeName}</td>
                        <td className="px-4 py-2">
                          {(r.position ? `#${r.position} — ` : '') + r.chapterTitle}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{r.wordCount.toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1 flex-wrap">
                            {r.entities.slice(0,5).map(e => (
                              <span
                                key={e.type+e.id}
                                className="px-2 py-0.5 rounded border text-xs"
                                title={`${e.label} — ${e.count}×`}
                              >
                                {e.label} <span className="text-gray-500">{e.count}×</span>
                              </span>
                            ))}
                            {r.entities.length > 5 && (
                              <span className="text-xs text-gray-500">+{r.entities.length-5}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredRows.length && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Aucun chapitre trouvé.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
