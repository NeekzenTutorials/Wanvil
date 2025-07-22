import type { FC } from 'react';
import Hierarchy from '../common/Hierarchy';
import { SidebarButton } from '../common/SidebarButton';
import { BookOpenText, Users, ListTree, Book, Clock, Cog } from 'lucide-react';
import type { SidebarSections } from '../../types/sidebarSections';
import type { SelectedNode } from '../../types/selectedNodes';


interface ProjectSidebarProps {
  active: SidebarSections
  setActive: (s: SidebarSections) => void
  onSelectNode: (node: SelectedNode) => void
  onRefreshTree: (fn: () => void) => void
}

export const ProjectSidebar: FC<ProjectSidebarProps> = ({ active, setActive, onSelectNode }) => {
  const onRefreshTree = (fn: () => void) => {
    // This function can be used to refresh the hierarchy tree
    fn();
  };
  return (
    <aside className="w-64 bg-white border-r shadow-sm flex flex-col py-6 px-4 gap-6 overflow-y-auto">
      {/* Sections principales */}
      <nav className="flex flex-col gap-1">
        <SidebarButton
          icon={<BookOpenText className="w-4 h-4" />}
          label="Rédaction"
          active={active === 'redaction'}
          onClick={() => setActive('redaction')}
        />

        <SidebarButton
          icon={<Users className="w-4 h-4" />}
          label="Personnages"
          active={active === 'lore-characters'}
          onClick={() => setActive('lore-characters')}
        />

        <SidebarButton
          icon={<ListTree className="w-4 h-4" />}
          label="Lieux"
          active={active === 'lore-places'}
          onClick={() => setActive('lore-places')}
        />

        <SidebarButton
          icon={<Book className="w-4 h-4" />}
          label="Objets"
          active={active === 'lore-items'}
          onClick={() => setActive('lore-items')}
        />

        <SidebarButton
          icon={<Clock className="w-4 h-4" />}
          label="Chronologie"
          active={active === 'chronology'}
          onClick={() => setActive('chronology')}
        />

        <SidebarButton
          icon={<Cog className="w-4 h-4" />}
          label="Paramètres"
          active={active === 'settings'}
          onClick={() => setActive('settings')}
        />
      </nav>

      {/* Contenu contextuel de la section ------------------------------------ */}
      <div className="flex-1 overflow-y-auto mt-4">
        <p className="text-sm text-gray-500 px-2 mb-2"> Contenu de la section</p>
        {active === 'redaction' && <Hierarchy onSelect={onSelectNode} onRefreshReady={onRefreshTree} />}
        {active.startsWith('lore-') && (
          <p className="text-sm text-gray-500 px-2">(À venir…)</p>
        )}
        {active === 'chronology' && (
          <p className="text-sm text-gray-500 px-2">(Timeline bientôt disponible)</p>
        )}
        {active === 'settings' && (
          <p className="text-sm text-gray-500 px-2">(Paramètres du projet)</p>
        )}
      </div>
    </aside>
  )
}