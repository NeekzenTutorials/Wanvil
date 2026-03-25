// src/components/gameDesign/mapEditor/RoomBankPanel.tsx
// Panel listing saved room templates (bank) and allowing placement

import type { FC } from 'react'
import type { RoomTemplate } from '../../../types/gameDesign'
import { Trash2, Plus } from 'lucide-react'

interface Props {
  templates: RoomTemplate[]
  onPlace: (templateId: string) => void
  onDelete: (templateId: string) => void
}

export const RoomBankPanel: FC<Props> = ({ templates, onPlace, onDelete }) => {
  if (templates.length === 0) {
    return (
      <div className="text-xs text-gray-400 italic px-3 py-2">
        Aucun modèle sauvegardé. Sélectionnez une salle et cliquez « Banque » pour la sauvegarder ici.
      </div>
    )
  }

  return (
    <div className="space-y-1 px-1">
      {templates.map(t => (
        <div key={t.id} className="group flex items-center gap-2 border rounded px-2 py-1.5 hover:bg-gray-50">
          {/* Preview swatch */}
          <div className="w-6 h-6 rounded shrink-0 border" style={{ backgroundColor: t.color + '66', borderColor: t.color }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{t.name}</p>
            <p className="text-[10px] text-gray-400">
              {t.type === 'rect' ? `${Math.round(t.w)}×${Math.round(t.h)}` : `Polygone ${t.points?.length ?? 0} pts`}
            </p>
          </div>
          <button onClick={() => onPlace(t.id)} className="p-1 text-indigo-500 hover:text-indigo-700" title="Placer sur la carte">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(t.id)} className="p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100" title="Supprimer">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
