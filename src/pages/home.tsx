// src/pages/Home.tsx
import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Rocket,
  Feather,
  BookOpenText,
  ListTree,
  Wand2,
  BarChart3,
  FileDown,
  StickyNote,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from '../i18n'

function Home(): ReactElement {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      {/* Header – minimal et focalisé */}
      <header className="sticky top-0 z-40 backdrop-blur border-b border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Wanvil</span>
            <span className="ml-2 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-400">Beta</span>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              to="/project/open"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('home.openProject')}
            </Link>
            <Link
              to="/project/new"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              {t('home.launchProject')} <Rocket className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-grow">
        <section className="relative">
          {/* Décors doux */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(600px_circle_at_20%_20%,black,transparent)]">
            <div className="absolute -top-16 -left-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
            <div className="absolute top-24 -right-10 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl">
                {t('home.tagline')}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                {t('home.subtitle')}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/project/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white shadow-md hover:bg-indigo-700"
                >
                  {t('home.createNew')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/project/open"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 px-6 py-3 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {t('home.openExisting')}
                </Link>
              </div>

              <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                {t('home.noSignup')}
              </div>
            </div>

            {/* Aperçu / Mock minimaliste */}
            <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                  <Feather className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  {t('home.richEditor')}
                </div>
                <div className="h-28 rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 p-3 text-xs text-gray-500">
                  <div className="mb-2 h-3 w-2/5 rounded bg-gray-200 dark:bg-gray-600" />
                  <div className="mb-1 h-2 w-full rounded bg-gray-100 dark:bg-gray-600" />
                  <div className="mb-1 h-2 w-5/6 rounded bg-gray-100 dark:bg-gray-600" />
                  <div className="h-2 w-4/6 rounded bg-gray-100 dark:bg-gray-600" />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                  <ListTree className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  {t('home.hierarchy')}
                </div>
                <div className="h-28 rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 p-3 text-xs text-gray-500">
                  <div className="mb-1 h-2 w-3/5 rounded bg-gray-100 dark:bg-gray-600" />
                  <div className="ml-4 mb-1 h-2 w-2/5 rounded bg-gray-100 dark:bg-gray-600" />
                  <div className="ml-8 h-2 w-2/6 rounded bg-gray-100 dark:bg-gray-600" />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                  <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  Analytics
                </div>
                <div className="h-28 rounded-lg border border-gray-200 dark:border-gray-600 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 p-3">
                  <div className="flex h-full items-end gap-2">
                    <div className="h-6 w-4 rounded bg-indigo-300" />
                    <div className="h-10 w-4 rounded bg-indigo-400" />
                    <div className="h-16 w-4 rounded bg-indigo-500" />
                    <div className="h-9 w-4 rounded bg-indigo-400" />
                    <div className="h-12 w-4 rounded bg-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fonctionnalités */}
        <section className="mx-auto max-w-7xl px-6 py-16">
          <h2 className="text-center text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {t('home.featuresTitle')}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-gray-600 dark:text-gray-400">
            {t('home.featuresSubtitle')}
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<BookOpenText className="h-5 w-5" />}
              title={t('home.feat1Title')}
              desc={t('home.feat1Desc')}
            />
            <Feature
              icon={<ListTree className="h-5 w-5" />}
              title={t('home.feat2Title')}
              desc={t('home.feat2Desc')}
            />
            <Feature
              icon={<Wand2 className="h-5 w-5" />}
              title={t('home.feat3Title')}
              desc={t('home.feat3Desc')}
            />
            <Feature
              icon={<BarChart3 className="h-5 w-5" />}
              title={t('home.feat4Title')}
              desc={t('home.feat4Desc')}
            />
            <Feature
              icon={<FileDown className="h-5 w-5" />}
              title={t('home.feat5Title')}
              desc={t('home.feat5Desc')}
            />
            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              title={t('home.feat6Title')}
              desc={t('home.feat6Desc')}
            />
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 sm:p-10">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{t('home.getStarted')}</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <Step
                number={1}
                title={t('home.step1Title')}
                desc={t('home.step1Desc')}
              />
              <Step
                number={2}
                title={t('home.step2Title')}
                desc={t('home.step2Desc')}
              />
              <Step
                number={3}
                title={t('home.step3Title')}
                desc={t('home.step3Desc')}
              />
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/project/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-white shadow hover:bg-indigo-700"
              >
                {t('home.launchNow')} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/project/open"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 px-5 py-3 text-gray-800 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700"
              >
                {t('home.openExisting')}
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Wanvil — {t('home.footer')}
        </div>
      </footer>
    </div>
  )
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: ReactElement
  title: string
  desc: string
}) {
  return (
    <div className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition hover:shadow">
      <div className="mb-3 inline-flex rounded-md bg-indigo-50 dark:bg-indigo-950 p-2 text-indigo-700 dark:text-indigo-300">
        {icon}
      </div>
      <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</div>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  )
}

function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-5 shadow-sm">
      <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
        {number}
      </div>
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</div>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{desc}</p>
    </div>
  )
}

export default Home
