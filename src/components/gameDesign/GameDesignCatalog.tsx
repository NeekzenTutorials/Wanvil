// src/components/gameDesign/GameDesignCatalog.tsx
// Shows available game design components as cards for the user to add to their project

import type { FC } from 'react'
import type { GameDesignComponent } from '../../types/gameDesign'
import { Map as MapIcon } from 'lucide-react'

interface CatalogEntry {
  key: GameDesignComponent
  label: string
  description: string
  icon: typeof MapIcon
}

const CATALOG: CatalogEntry[] = [
  {
    key: 'map-editor',
    label: 'Éditeur de Map 2D',
    description: 'Créez des cartes 2D avec des salles rectangulaires ou polygonales, des autocollants (items, ennemis, PNJ…), et gérez plusieurs zones et étages.',
    icon: MapIcon,
  },
  // Future components go here
]

interface Props {
  enabledComponents: GameDesignComponent[]
  onAdd: (c: GameDesignComponent) => void
}

export const GameDesignCatalog: FC<Props> = ({ enabledComponents, onAdd }) => {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Game Design — Composants</h2>
      <p className="text-sm text-gray-500 mb-6">Ajoutez des outils de game design à votre projet.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATALOG.map(entry => {
          const Icon = entry.icon
          const isEnabled = enabledComponents.includes(entry.key)
          return (
            <div
              key={entry.key}
              className={`border rounded-xl p-5 flex flex-col gap-3 transition ${isEnabled ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white hover:shadow-md hover:border-indigo-300'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isEnabled ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-600'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-medium text-sm">{entry.label}</h3>
              </div>
              <p className="text-xs text-gray-500 flex-1">{entry.description}</p>
              <button
                disabled={isEnabled}
                onClick={() => onAdd(entry.key)}
                className={`mt-auto text-xs font-medium px-4 py-2 rounded-lg transition ${isEnabled ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
              >
                {isEnabled ? 'Déjà ajouté' : 'Ajouter au projet'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
