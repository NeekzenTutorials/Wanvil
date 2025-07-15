// src/pages/Home.tsx
import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'

function Home(): ReactElement {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Wanvil</h1>
          <nav className="space-x-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link to="/settings" className="text-gray-600 hover:text-gray-900">
              Paramètres
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-grow container mx-auto px-6 py-12 flex flex-col items-center">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-4 text-center">
          Bienvenue dans votre nouvel outil d’écriture
        </h2>
        <p className="text-lg text-gray-600 mb-8 text-center max-w-2xl">
          Créez et organisez vos romans, suivez vos personnages et votre univers, et exportez vos manuscrits en un clic.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to="/project/new"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
          >
            + Nouveau projet
          </Link>
          <Link
            to="/project/open"
            className="px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
          >
            Ouvrir un projet
          </Link>
        </div>

        {/* Features Grid */}
        <section className="mt-16 w-full max-w-4xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Éditeur riche</h3>
              <p className="text-gray-600">
                Mise en forme avancée (gras, titres, couleurs), mode sans distraction et export PDF/ePub.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Hiérarchie</h3>
              <p className="text-gray-600">
                Organisez vos œuvres en collections, sagas, tomes et chapitres avec un simple glisser-déposer.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Fiches Personnages</h3>
              <p className="text-gray-600">
                Définissez le rôle, l’apparence, les objectifs et les relations de chacun de vos personnages.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Lore & Environnement</h3>
              <p className="text-gray-600">
                Gérez vos objets, lieux et événements, et créez des liens automatiques dans votre texte.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Timeline</h3>
              <p className="text-gray-600">
                Visualisez le fil de votre histoire avec une frise chronologique interactive.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Sync & Offline</h3>
              <p className="text-gray-600">
                PWA installable, fonctionne hors-ligne et synchronisation future sur tous vos appareils.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-6 py-4 text-center text-gray-500">
          © {new Date().getFullYear()} VotreLogiciel • Tous droits réservés
        </div>
      </footer>
    </div>
  )
}

export default Home;