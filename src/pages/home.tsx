// src/pages/Home.tsx
import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Rocket,
  BookOpenText,
  ListTree,
  Wand2,
  BarChart3,
  FileDown,
  ArrowRight,
  ShieldCheck,
  Users,
  MapPin,
  Sword,
  CalendarDays,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { useTranslation } from '../i18n'

/* ------------------------------------------------------------------ */
/*  Gradient accent colours per feature (light / dark friendly)       */
/* ------------------------------------------------------------------ */
const GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-sky-500 to-cyan-400',
  'from-fuchsia-500 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-emerald-500 to-teal-400',
  'from-rose-500 to-red-400',
] as const

/* ------------------------------------------------------------------ */
/*  Home                                                              */
/* ------------------------------------------------------------------ */
function Home(): ReactElement {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-gray-950 flex flex-col overflow-x-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/5 bg-white/60 dark:bg-gray-950/60">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Wanvil
            </span>
            <span className="ml-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
              Beta
            </span>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              to="/project/open"
              className="hidden sm:inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {t('home.openProject')}
            </Link>
            <Link
              to="/project/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow"
            >
              {t('home.launchProject')} <Rocket className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="relative">
          {/* Animated background orbs */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[100px] animate-float-slow" />
            <div className="absolute top-20 right-0 h-[400px] w-[400px] rounded-full bg-violet-400/20 dark:bg-violet-600/10 blur-[100px] animate-float-slow-reverse" />
            <div className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-fuchsia-300/15 dark:bg-fuchsia-600/5 blur-[100px] animate-float-slow" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-12 lg:pt-32 lg:pb-20">
            <div className="mx-auto max-w-3xl text-center">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800/60 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-6 animate-fade-in-up">
                <Sparkles className="h-3 w-3" />
                {t('home.noSignup')}
              </div>

              {/* Tagline with gradient */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] animate-fade-in-up">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
                  {t('home.tagline').split('.')[0]}.
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {t('home.tagline').split('.').slice(1).join('.').trim()}
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-gray-500 dark:text-gray-400 max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
                {t('home.subtitle')}
              </p>

              {/* CTA buttons */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up animation-delay-200">
                <Link
                  to="/project/new"
                  className="group relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300"
                >
                  {t('home.createNew')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/project/open"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-white/5 backdrop-blur px-8 py-4 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 transition-all duration-300"
                >
                  {t('home.openExisting')}
                </Link>
              </div>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500 animate-fade-in-up animation-delay-300">
                <span className="inline-flex items-center gap-1.5"><Wifi className="h-3 w-3" />{t('home.installable')}</span>
                <span className="h-3 w-px bg-gray-300 dark:bg-gray-700" />
                <span className="inline-flex items-center gap-1.5"><WifiOff className="h-3 w-3" />{t('home.offline')}</span>
                <span className="h-3 w-px bg-gray-300 dark:bg-gray-700" />
                <span className="inline-flex items-center gap-1.5"><FileDown className="h-3 w-3" />{t('home.pdfExport')}</span>
              </div>
            </div>

            {/* ── Hero visual: App preview mockup ──────────────── */}
            <div className="mx-auto mt-16 max-w-5xl animate-fade-in-up animation-delay-400">
              <div className="relative rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-2xl shadow-gray-900/5 dark:shadow-black/30 p-1.5 sm:p-2">
                {/* Window chrome */}
                <div className="flex items-center gap-1.5 px-3 py-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                  <div className="ml-3 flex-1 rounded-lg bg-gray-100 dark:bg-white/5 h-5" />
                </div>

                {/* Simulated layout */}
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-900 overflow-hidden grid grid-cols-12 h-64 sm:h-80">
                  {/* Sidebar */}
                  <div className="col-span-3 border-r border-gray-200 dark:border-gray-800 p-3 space-y-2">
                    <div className="h-5 w-20 rounded-md bg-indigo-100 dark:bg-indigo-900/40" />
                    <div className="space-y-1.5 mt-3">
                      {['w-24', 'w-20', 'w-28', 'w-16', 'w-22'].map((w, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-indigo-400/60" />
                          <div className={`h-2.5 ${w} rounded bg-gray-200 dark:bg-gray-700`} />
                        </div>
                      ))}
                      <div className="mt-3 h-px bg-gray-200 dark:bg-gray-800" />
                      <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700 mt-2" />
                      {['w-20', 'w-24', 'w-18'].map((w, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-sm bg-violet-400/60" />
                          <div className={`h-2.5 ${w} rounded bg-gray-200 dark:bg-gray-700`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main content area */}
                  <div className="col-span-9 p-4 sm:p-6">
                    <div className="h-5 w-48 rounded-md bg-gray-200 dark:bg-gray-700 mb-4" />
                    <div className="space-y-2.5">
                      <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-2.5 w-11/12 rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-2.5 w-4/5 rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-2.5 w-3/4 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                    {/* Inline entity tag */}
                    <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 font-medium">@Character</span>
                      <span className="rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 font-medium">#Place</span>
                      <span className="rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 font-medium">~Item</span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-2.5 w-5/6 rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow underneath */}
              <div aria-hidden className="pointer-events-none mx-auto -mt-8 h-16 w-3/4 rounded-full bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20 blur-2xl" />
            </div>
          </div>
        </section>

        {/* ── Bento grid – Features ────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              {t('home.featuresTitle')}
            </h2>
            <p className="mt-3 text-base text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {t('home.featuresSubtitle')}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {/* Feature 1 – big card */}
            <BentoCard
              gradient={GRADIENTS[0]}
              icon={<BookOpenText className="h-5 w-5" />}
              title={t('home.feat1Title')}
              desc={t('home.feat1Desc')}
              className="lg:col-span-2"
            >
              {/* Rich editor mini-visual */}
              <div className="mt-4 rounded-xl border border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur p-3 space-y-2.5">
                <div className="flex gap-2">
                  {['B', 'I', 'U', 'H1', 'H2'].map(b => (
                    <div key={b} className="h-6 w-7 rounded bg-white/50 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">{b}</div>
                  ))}
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/40 dark:bg-white/10" />
                <div className="h-2.5 w-5/6 rounded-full bg-white/30 dark:bg-white/5" />
                <div className="h-2.5 w-4/6 rounded-full bg-white/30 dark:bg-white/5" />
              </div>
            </BentoCard>

            {/* Feature 2 */}
            <BentoCard
              gradient={GRADIENTS[1]}
              icon={<ListTree className="h-5 w-5" />}
              title={t('home.feat2Title')}
              desc={t('home.feat2Desc')}
            >
              {/* Hierarchy tree visual */}
              <div className="mt-4 space-y-1.5 text-[11px] font-medium text-white/80">
                {[
                  { label: 'Collection', indent: 0 },
                  { label: 'Saga', indent: 1 },
                  { label: 'Tome I', indent: 2 },
                  { label: 'Chap 1', indent: 3 },
                  { label: 'Chap 2', indent: 3 },
                  { label: 'Tome II', indent: 2 },
                ].map((n, i) => (
                  <div key={i} className="flex items-center gap-1.5" style={{ paddingLeft: n.indent * 14 }}>
                    <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                    <span>{n.label}</span>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Feature 3 */}
            <BentoCard
              gradient={GRADIENTS[2]}
              icon={<Wand2 className="h-5 w-5" />}
              title={t('home.feat3Title')}
              desc={t('home.feat3Desc')}
            >
              {/* Entity chips */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { icon: <Users className="h-3 w-3" />, label: 'Characters' },
                  { icon: <MapPin className="h-3 w-3" />, label: 'Places' },
                  { icon: <Sword className="h-3 w-3" />, label: 'Items' },
                  { icon: <CalendarDays className="h-3 w-3" />, label: 'Events' },
                ].map(e => (
                  <span key={e.label} className="inline-flex items-center gap-1 rounded-lg bg-white/20 dark:bg-white/10 backdrop-blur px-2.5 py-1 text-[11px] font-medium text-white/90">
                    {e.icon} {e.label}
                  </span>
                ))}
              </div>
            </BentoCard>

            {/* Feature 4 */}
            <BentoCard
              gradient={GRADIENTS[3]}
              icon={<BarChart3 className="h-5 w-5" />}
              title={t('home.feat4Title')}
              desc={t('home.feat4Desc')}
            >
              {/* Mini bar chart */}
              <div className="mt-4 flex items-end gap-1.5 h-16">
                {[35, 55, 75, 45, 65, 85, 50, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-white/30 dark:bg-white/20 transition-all hover:bg-white/50"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </BentoCard>

            {/* Feature 5 */}
            <BentoCard
              gradient={GRADIENTS[4]}
              icon={<FileDown className="h-5 w-5" />}
              title={t('home.feat5Title')}
              desc={t('home.feat5Desc')}
            >
              <div className="mt-4 flex items-center justify-center">
                <div className="relative h-20 w-16 rounded-lg bg-white/30 dark:bg-white/10 shadow-sm flex flex-col items-center justify-center">
                  <div className="text-[10px] font-bold text-white/80 tracking-wider">PDF</div>
                  <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white/40 flex items-center justify-center">
                    <ArrowRight className="h-2.5 w-2.5 text-white/80 -rotate-45" />
                  </div>
                </div>
              </div>
            </BentoCard>

            {/* Feature 6 */}
            <BentoCard
              gradient={GRADIENTS[5]}
              icon={<ShieldCheck className="h-5 w-5" />}
              title={t('home.feat6Title')}
              desc={t('home.feat6Desc')}
            >
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-1 text-[11px] font-medium text-white/80">
                  <Wifi className="h-3.5 w-3.5" /> Online
                </div>
                <div className="h-4 w-px bg-white/20" />
                <div className="flex items-center gap-1 text-[11px] font-medium text-white/80">
                  <WifiOff className="h-3.5 w-3.5" /> Offline
                </div>
              </div>
            </BentoCard>
          </div>
        </section>

        {/* ── Lore entities showcase ──────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Users className="h-5 w-5" />, label: t('sidebar.characters'), color: 'from-indigo-500 to-blue-600' },
              { icon: <MapPin className="h-5 w-5" />, label: t('sidebar.places'), color: 'from-emerald-500 to-teal-600' },
              { icon: <Sword className="h-5 w-5" />, label: t('sidebar.items'), color: 'from-amber-500 to-orange-600' },
              { icon: <CalendarDays className="h-5 w-5" />, label: t('sidebar.events'), color: 'from-rose-500 to-pink-600' },
            ].map(entity => (
              <div
                key={entity.label}
                className="group relative rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/5 p-6 overflow-hidden hover:scale-[1.02] transition-transform duration-300"
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${entity.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className={`relative inline-flex rounded-xl bg-gradient-to-br ${entity.color} p-2.5 text-white shadow-lg mb-3`}>
                  {entity.icon}
                </div>
                <div className="relative text-base font-semibold text-gray-900 dark:text-white">{entity.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works – Timeline ──────────────────────────── */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <div className="relative rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950 dark:from-gray-800/50 dark:via-gray-900/80 dark:to-indigo-950/50 p-8 sm:p-12 overflow-hidden">
            {/* Decorative orbs */}
            <div aria-hidden className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
            <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-violet-500/10 blur-[60px]" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-3 py-1 text-xs font-medium text-indigo-300 mb-4">
                <Clock className="h-3 w-3" />
                {t('home.getStarted')}
              </div>

              <div className="mt-6 grid gap-8 sm:grid-cols-3">
                {[
                  { n: 1, title: t('home.step1Title'), desc: t('home.step1Desc') },
                  { n: 2, title: t('home.step2Title'), desc: t('home.step2Desc') },
                  { n: 3, title: t('home.step3Title'), desc: t('home.step3Desc') },
                ].map((step, i) => (
                  <div key={step.n} className="relative group">
                    {/* Connector line (hidden on first) */}
                    {i > 0 && (
                      <div className="hidden sm:block absolute top-5 -left-4 w-4 border-t border-dashed border-white/20" />
                    )}
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
                      {step.n}
                    </div>
                    <div className="text-base font-semibold text-white">{step.title}</div>
                    <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/project/new"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] transition-all duration-300"
                >
                  {t('home.launchNow')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/project/open"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-7 py-3.5 text-sm font-medium text-white/80 hover:bg-white/5 transition-all duration-300"
                >
                  {t('home.openExisting')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-gray-200/60 dark:border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Sparkles className="h-3 w-3" />
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Wanvil</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            © {new Date().getFullYear()} Wanvil — {t('home.footer')}
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  BentoCard                                                         */
/* ------------------------------------------------------------------ */
function BentoCard({
  gradient,
  icon,
  title,
  desc,
  children,
  className = '',
}: {
  gradient: string
  icon: ReactElement
  title: string
  desc: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`group relative rounded-3xl p-6 overflow-hidden bg-gradient-to-br ${gradient} text-white shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 ${className}`}
    >
      {/* Subtle pattern overlay */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_60%_30%,white_1px,transparent_1px)] bg-[size:20px_20px]" />

      <div className="relative">
        <div className="mb-3 inline-flex rounded-xl bg-white/20 backdrop-blur p-2.5">
          {icon}
        </div>
        <div className="text-lg font-bold">{title}</div>
        <p className="mt-1 text-sm text-white/75 leading-relaxed">{desc}</p>
        {children}
      </div>
    </div>
  )
}

export default Home
