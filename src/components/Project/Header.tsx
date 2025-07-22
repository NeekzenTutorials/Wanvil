import type { FC } from 'react'
import { Link } from 'react-router-dom'
import { MoveLeft } from 'lucide-react'

export const ProjectHeader: FC<{ projectName?: string }> = ({ projectName }) => (
  <header className="h-16 w-full bg-white shadow flex items-center px-6 gap-4 shrink-0">
    <Link
      to="/project/open"
      className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition"
    >
      <MoveLeft className="w-6 h-6" />
      <span className="sr-only">Retour aux projets</span>
    </Link>

    <h1 className="text-xl font-semibold leading-none truncate">
      Tableau de bord — <span className="font-normal">{projectName ?? '…'}</span>
    </h1>
  </header>
)
