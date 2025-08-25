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

function Home(): ReactElement {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header – minimal et focalisé */}
      <header className="sticky top-0 z-40 backdrop-blur border-b bg-white/70">
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-gray-900">Wanvil</span>
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Beta</span>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              to="/project/open"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Ouvrir un projet
            </Link>
            <Link
              to="/project/new"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              Lancer un projet <Rocket className="h-4 w-4" />
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
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(600px_circle_at_20%_20%,black,transparent)]">
            <div className="absolute -top-16 -left-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
            <div className="absolute top-24 -right-10 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                Écrivez. Structurez. Publiez.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                Wanvil vous aide à concevoir vos univers, suivre vos personnages et produire des manuscrits impeccables —
                sans friction.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/project/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-white shadow-md hover:bg-indigo-700"
                >
                  Créer un nouveau projet <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/project/open"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-6 py-3 text-gray-800 hover:bg-gray-50"
                >
                  Ouvrir un projet existant
                </Link>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                Sans inscription. PWA installable. Export PDF intégré.
              </div>
            </div>

            {/* Aperçu / Mock minimaliste */}
            <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
                  <Feather className="h-4 w-4 text-indigo-600" />
                  Éditeur riche
                </div>
                <div className="h-28 rounded-lg border bg-gradient-to-br from-gray-50 to-white p-3 text-xs text-gray-500">
                  <div className="mb-2 h-3 w-2/5 rounded bg-gray-200" />
                  <div className="mb-1 h-2 w-full rounded bg-gray-100" />
                  <div className="mb-1 h-2 w-5/6 rounded bg-gray-100" />
                  <div className="h-2 w-4/6 rounded bg-gray-100" />
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
                  <ListTree className="h-4 w-4 text-indigo-600" />
                  Hiérarchie
                </div>
                <div className="h-28 rounded-lg border bg-gradient-to-br from-gray-50 to-white p-3 text-xs text-gray-500">
                  <div className="mb-1 h-2 w-3/5 rounded bg-gray-100" />
                  <div className="ml-4 mb-1 h-2 w-2/5 rounded bg-gray-100" />
                  <div className="ml-8 h-2 w-2/6 rounded bg-gray-100" />
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-800">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  Analytics
                </div>
                <div className="h-28 rounded-lg border bg-gradient-to-br from-gray-50 to-white p-3">
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
          <h2 className="text-center text-2xl font-semibold text-gray-900">
            Tout ce qu’il faut pour écrire sans se disperser
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-gray-600">
            Une interface claire, des outils puissants. Tout est là, juste au bon endroit.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={<BookOpenText className="h-5 w-5" />}
              title="Éditeur sans friction"
              desc="Mise en forme, mode rendu, notes privées et annotations contextuelles."
            />
            <Feature
              icon={<ListTree className="h-5 w-5" />}
              title="Organisation hiérarchique"
              desc="Collections → Sagas → Tomes → Chapitres. Reordonnable, clair et scalable."
            />
            <Feature
              icon={<Wand2 className="h-5 w-5" />}
              title="Liens & entités"
              desc="Auto-complétion pour personnages, lieux, objets, événements—directement dans le texte."
            />
            <Feature
              icon={<BarChart3 className="h-5 w-5" />}
              title="Analytics intégrés"
              desc="Compteurs de mots, entités les plus citées, top mots, répartitions par tome."
            />
            <Feature
              icon={<FileDown className="h-5 w-5" />}
              title="Export propre"
              desc="Export PDF (WeasyPrint / wkhtmltopdf) au rendu soigné, prêt à partager."
            />
            <Feature
              icon={<ShieldCheck className="h-5 w-5" />}
              title="PWA & hors-ligne"
              desc="Application installable, fonctionne sans réseau. Vos idées, où que vous soyez."
            />
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="rounded-2xl border bg-gray-50 p-6 sm:p-10">
            <h3 className="text-xl font-semibold text-gray-900">Commencez en 30 secondes</h3>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              <Step
                number={1}
                title="Créez un projet"
                desc="Donnez un nom à votre univers. Pas de configuration compliquée."
              />
              <Step
                number={2}
                title="Structurez"
                desc="Ajoutez sagas, tomes et chapitres. L’ossature prend forme en un clin d’œil."
              />
              <Step
                number={3}
                title="Écrivez & reliez"
                desc="Notez, annotez, liez aux entités. Visualisez et exportez quand vous êtes prêt."
              />
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link
                to="/project/new"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-white shadow hover:bg-indigo-700"
              >
                Lancer un projet maintenant <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/project/open"
                className="inline-flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-gray-800 hover:bg-white"
              >
                Ouvrir un projet existant
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Wanvil — Écrivez des mondes qui restent.
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
    <div className="group rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow">
      <div className="mb-3 inline-flex rounded-md bg-indigo-50 p-2 text-indigo-700">
        {icon}
      </div>
      <div className="text-base font-semibold text-gray-900">{title}</div>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  )
}

function Step({ number, title, desc }: { number: number; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
        {number}
      </div>
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  )
}

export default Home
