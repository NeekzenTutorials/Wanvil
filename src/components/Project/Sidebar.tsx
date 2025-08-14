import type { FC } from 'react';
import Hierarchy from '../common/Hierarchy';
import { SidebarButton } from '../common/SidebarButton';
import { BookOpenText, Users, ListTree, Book, Clock, Cog, LayoutTemplate, Tag as TagIcon } from 'lucide-react';
import type { SidebarSections, CharactersSubView } from '../../types/sidebarSections';
import type { SelectedNode } from '../../types/selectedNodes';

interface ProjectSidebarProps {
  active: SidebarSections
  setActive: (s: SidebarSections) => void
  charactersView: CharactersSubView
  setCharactersView: (v: CharactersSubView) => void
  onSelectNode: (node: SelectedNode) => void
  onRefreshTree: (fn: () => void) => void
}

export const ProjectSidebar: FC<ProjectSidebarProps> = ({
  active, setActive, charactersView, setCharactersView, onSelectNode, onRefreshTree
}) => {
  // helper pour le style des sous-entrées
  const subItemClass = (on:boolean) =>
    `w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition
     ${on ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'}
     `;

  return (
    <aside className="w-64 bg-white border-r shadow-sm flex flex-col py-6 px-4 gap-6 overflow-y-auto">
      <nav className="flex flex-col gap-1">
        <SidebarButton
          icon={<BookOpenText className="w-4 h-4" />}
          label="Rédaction"
          active={active === 'redaction'}
          onClick={() => setActive('redaction')}
        />

        {/* Personnages */}
        <div className="mt-2 mb-1 text-xs font-semibold text-gray-500 px-2 uppercase tracking-wide">
          Personnages
        </div>
        <SidebarButton
          icon={<Users className="w-4 h-4" />}
          label="Personnages"
          active={active === 'characters'}
          onClick={() => setActive('characters')}
        />

        <div className="mt-3 mb-1 text-xs font-semibold text-gray-500 px-2 uppercase tracking-wide">Lore</div>
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

      {/* Panneau contextuel */}
      <div className="flex-1 overflow-y-auto mt-4">
        <p className="text-sm text-gray-500 px-2 mb-2">Contenu de la section</p>

        {active === 'redaction' && (
          <Hierarchy onSelect={onSelectNode} onRefreshReady={onRefreshTree} />
        )}

        {active === 'characters' && (
          <div className="px-2">
            {/* Sous-menu vertical (compact, ne déborde jamais) */}
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  className={subItemClass(charactersView === 'list')}
                  onClick={() => setCharactersView('list')}
                  aria-current={charactersView === 'list' ? 'page' : undefined}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">Liste</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={subItemClass(charactersView === 'template')}
                  onClick={() => setCharactersView('template')}
                  aria-current={charactersView === 'template' ? 'page' : undefined}
                >
                  <LayoutTemplate className="w-4 h-4 shrink-0" />
                  <span className="truncate">Template</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className={subItemClass(charactersView === 'tags')}
                  onClick={() => setCharactersView('tags')}
                  aria-current={charactersView === 'tags' ? 'page' : undefined}
                >
                  <TagIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">Tags</span>
                </button>
              </li>
            </ul>

            <p className="text-xs text-gray-500 mt-3">
              Choisissez la vue : gestion des fiches, personnalisation du template, ou gestion des tags.
            </p>
          </div>
        )}

        {active !== 'redaction' && active !== 'characters' && (
          <p className="text-sm text-gray-500 px-2">Sélectionnez un élément du menu.</p>
        )}
      </div>
    </aside>
  )
}
