// src/components/Project/Sidebar.tsx
import type { FC, CSSProperties } from 'react'
import Hierarchy from '../common/Hierarchy'
import { SidebarButton } from '../common/SidebarButton'
import {
  BookOpenText, Users, ListTree, Book, Clock, Cog,
  LayoutTemplate, Calendar, BarChart3, Tag as TagIcon, X,
  Gamepad2, Map as MapIcon, Plus
} from 'lucide-react'
import type { SidebarSections, CharactersSubView } from '../../types/sidebarSections'
import type { SelectedNode } from '../../types/selectedNodes'
import type { GameDesignComponent } from '../../types/gameDesign'

interface ProjectSidebarProps {
  active: SidebarSections
  setActive: (s: SidebarSections) => void
  charactersView: CharactersSubView
  setCharactersView: (v: CharactersSubView) => void
  onSelectNode: (node: SelectedNode) => void
  onRefreshTree: (fn: () => void) => void
  className?: string
  style?: CSSProperties
  onCloseMobile?: () => void
  gameDesignComponents?: GameDesignComponent[]
  onShowCatalog?: () => void
  onRemoveGameDesignComponent?: (c: GameDesignComponent) => void
  onSelectGameDesignComponent?: (c: GameDesignComponent) => void
  activeGameDesignComponent?: GameDesignComponent | null
}

const GD_AVAILABLE: { key: GameDesignComponent; label: string; icon: typeof MapIcon }[] = [
  { key: 'map-editor', label: 'Éditeur de Map 2D', icon: MapIcon },
]

export const ProjectSidebar: FC<ProjectSidebarProps> = ({
  active, setActive, charactersView, setCharactersView, onSelectNode, onRefreshTree,
  className = '', style, onCloseMobile,
  gameDesignComponents = [], onShowCatalog, onRemoveGameDesignComponent, onSelectGameDesignComponent, activeGameDesignComponent
}) => {
  const subItemClass = (on:boolean) =>
    `w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition
     ${on ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'}`

  return (
    <aside
      className={`bg-white border-r shadow-sm flex flex-col py-6 px-4 gap-6 overflow-y-auto ${className}`}
      style={style}
    >
      {/* Header drawer mobile */}
      <div className="md:hidden -mt-2 -mx-2 mb-1 px-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Menu</span>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-2 rounded hover:bg-gray-100"
            aria-label="Fermer la barre latérale"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1">
        <SidebarButton
          icon={<BookOpenText className="w-4 h-4" />}
          label="Rédaction"
          active={active === 'redaction'}
          onClick={() => setActive('redaction')}
        />

        <div className="mt-3 mb-1 text-xs font-semibold text-gray-500 px-2 uppercase tracking-wide">Lore</div>
        <SidebarButton icon={<Users className="w-4 h-4" />} label="Personnages"
          active={active === 'characters'} onClick={() => setActive('characters')} />
        <SidebarButton icon={<ListTree className="w-4 h-4" />} label="Lieux"
          active={active === 'lore-places' || active === 'lore-places-tags'}
          onClick={() => setActive('lore-places')} />
        <SidebarButton icon={<Book className="w-4 h-4" />} label="Objets"
          active={active === 'lore-items' || active === 'lore-items-tags'}
          onClick={() => setActive('lore-items')} />
        <SidebarButton icon={<Clock className="w-4 h-4" />} label="Évènements"
          active={active === 'lore-events' || active === 'lore-events-tags'}
          onClick={() => setActive('lore-events')} />

        <div className="mt-3 mb-1 text-xs font-semibold text-gray-500 px-2 uppercase tracking-wide">Gestion</div>
        <SidebarButton icon={<Calendar className="w-4 h-4" />} label="Chronologie"
          active={active === 'chronology'} onClick={() => setActive('chronology')} />
        <SidebarButton icon={<BarChart3 className="w-4 h-4" />} label="Analytics"
          active={active === 'analytics'} onClick={() => setActive('analytics')} />
        <SidebarButton icon={<Cog className="w-4 h-4" />} label="Paramètres"
          active={active === 'settings'} onClick={() => setActive('settings')} />

        <div className="mt-3 mb-1 text-xs font-semibold text-gray-500 px-2 uppercase tracking-wide flex items-center justify-between">
          <span>Game Design</span>
          {onShowCatalog && (
            <button
              onClick={() => {
                onShowCatalog()
                setActive('game-design-catalog')
              }}
              className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
              title="Ajouter un composant Game Design"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {gameDesignComponents.map(c => {
          const meta = GD_AVAILABLE.find(g => g.key === c)
          if (!meta) return null
          const Icon = meta.icon
          const isActive = active === 'game-design' && activeGameDesignComponent === c
          return (
            <div key={c} className="group flex items-center">
              <div className="flex-1">
                <SidebarButton
                  icon={<Icon className="w-4 h-4" />}
                  label={meta.label}
                  active={isActive}
                  onClick={() => {
                    setActive('game-design')
                    onSelectGameDesignComponent?.(c)
                  }}
                />
              </div>
              {onRemoveGameDesignComponent && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveGameDesignComponent(c) }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-opacity"
                  title="Supprimer ce composant"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )
        })}
        {gameDesignComponents.length === 0 && (
          <p className="text-xs text-gray-400 px-3 py-1 italic">Cliquez + pour ajouter</p>
        )}
      </nav>

      {/* Panneau contextuel */}
      <div className="flex-1 overflow-y-auto mt-4">
        <p className="text-sm text-gray-500 px-2 mb-2">Contenu de la section</p>

        {active === 'redaction' && ( <Hierarchy onSelect={onSelectNode} onRefreshReady={onRefreshTree} /> )} 
        {active === 'characters' && ( 
          <div className="px-2"> {/* Sous-menu vertical (compact, ne déborde jamais) */} 
          <ul className="space-y-1"> 
            <li> 
              <button type="button" className={subItemClass(charactersView === 'list')} onClick={() => setCharactersView('list')} aria-current={charactersView === 'list' ? 'page' : undefined} > <Users className="w-4 h-4 shrink-0" /> 
                <span className="truncate">Liste</span> 
              </button> 
            </li> 
            <li>
              <button type="button" className={subItemClass(charactersView === 'template')} onClick={() => setCharactersView('template')} aria-current={charactersView === 'template' ? 'page' : undefined} > <LayoutTemplate className="w-4 h-4 shrink-0" />
                <span className="truncate">Template</span>
              </button>
            </li>
            <li>
              <button type="button" className={subItemClass(charactersView === 'tags')} onClick={() => setCharactersView('tags')} aria-current={charactersView === 'tags' ? 'page' : undefined} > <TagIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Tags</span>
              </button>
            </li>
          </ul>
          <p className="text-xs text-gray-500 mt-3"> Choisissez la vue : gestion des fiches, personnalisation du template, ou gestion des tags. </p> </div> )}
          
          {(active === 'lore-places' || active === 'lore-places-tags') && ( <div className="px-2"> {/* Sous-menu Lieux : aligné sur Personnages */}
            <ul className="space-y-1">
              <li>
                <button type="button" className={subItemClass(active === 'lore-places')} onClick={() => setActive('lore-places')} aria-current={active === 'lore-places' ? 'page' : undefined} > <ListTree className="w-4 h-4 shrink-0" />
                  <span className="truncate">Liste</span>
                </button>
              </li>
              <li>
                <button type="button" className={subItemClass(active === 'lore-places-tags')} onClick={() => setActive('lore-places-tags')} aria-current={active === 'lore-places-tags' ? 'page' : undefined} > <TagIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">Tags</span>
                </button>
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-3"> Astuce : utilisez les annotations de tag (ex. « région ») pour regrouper l’affichage. Les tags des lieux sont propres au scope <code>place</code>. </p> </div> )}
            
          {(active === 'lore-items' || active === 'lore-items-tags') && ( <div className="px-2">
            <ul className="space-y-1">
              <li>
                <button type="button" className={subItemClass(active === 'lore-items')} onClick={() => setActive('lore-items')} aria-current={active === 'lore-items' ? 'page' : undefined} > <Book className="w-4 h-4 shrink-0" />
                  <span className="truncate">Liste</span>
                </button>
              </li>
              <li>
                <button type="button" className={subItemClass(active === 'lore-items-tags')} onClick={() => setActive('lore-items-tags')} aria-current={active === 'lore-items-tags' ? 'page' : undefined} > <TagIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">Tags</span>
                </button>
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-3"> Les tags des objets sont isolés (scope <code>item</code>). </p> </div> )}
            
          {(active === 'lore-events' || active === 'lore-events-tags') && ( <div className="px-2">
            <ul className="space-y-1">
              <li>
                <button type="button" className={subItemClass(active === 'lore-events')} onClick={() => setActive('lore-events')} aria-current={active === 'lore-events' ? 'page' : undefined} > <Clock className="w-4 h-4 shrink-0" />
                  <span className="truncate">Liste</span>
                </button>
              </li>
              <li>
                <button type="button" className={subItemClass(active === 'lore-events-tags')} onClick={() => setActive('lore-events-tags')} aria-current={active === 'lore-events-tags' ? 'page' : undefined} > <TagIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">Tags</span>
                </button>
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-3"> Les tags des évènements sont isolés (scope <code>event</code>). </p> </div> )}

          {active === 'game-design' && activeGameDesignComponent === 'map-editor' && (
            <div className="px-2">
              <p className="text-xs text-gray-500 mt-1">
                Créez des cartes 2D avec des salles, des autocollants et plusieurs zones/étages.
              </p>
            </div>
          )}
            
            {active !== 'redaction' && active !== 'characters' && active !== 'lore-places' && active !== 'lore-places-tags' && active !== 'lore-items' && active !== 'lore-items-tags' && active !== 'game-design' && (
              <p className="text-sm text-gray-500 px-2">Sélectionnez un élément du menu.</p> )} 
            </div> 
          </aside>
        )
      }