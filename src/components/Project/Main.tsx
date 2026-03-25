import type { FC } from 'react'
import type { SidebarSections, CharactersSubView } from '../../types/sidebarSections'
import type { SelectedNode } from '../../types/selectedNodes'
import type { GameDesignComponent } from '../../types/gameDesign'
import { NodeDetails } from '../common/NodeDetails'
import { CharactersPage } from '../characters/CharactersPage'
import { CharactersTemplatePage } from '../characters/CharactersTemplatePage'
import { DefaultPage } from '../common/DefaultPage'
import { CharacterTagsManagerPage } from '../characters/CharacterTagsManagerPage'
import { PlacesPage } from '../places/PlacesPage'
import { PlacesTagsManagerPage } from '../places/PlacesTagsManagerPage'
import { ItemsPage } from '../items/ItemsPage'
import { ItemsTagsManagerPage } from '../items/ItemsTagsManagerPage'
import { EventsPage } from '../events/EventsPage'
import { EventsTagsManagerPage } from '../events/EventsTagsManagerPage'
import { AnalyticsPage } from '../analytics/AnalyticsPage'
import { ChronologyPage } from '../chronology/ChronologyPage'
import { MapEditorPage } from '../gameDesign/mapEditor/MapEditorPage'
import { GameDesignCatalog } from '../gameDesign/GameDesignCatalog'

interface Props {
  active: SidebarSections
  charactersView: CharactersSubView
  selected: SelectedNode | null
  refreshTree: () => void
  projectId: string
  activeGameDesignComponent?: GameDesignComponent | null
  activeGdRecordId?: string | null
  enabledGdComponents?: GameDesignComponent[]
  onAddGameDesignComponent?: (c: GameDesignComponent) => void
}

export const ProjectMain: FC<Props> = ({ active, charactersView, selected, refreshTree, projectId, activeGameDesignComponent, activeGdRecordId, enabledGdComponents = [], onAddGameDesignComponent }) => {
  if (active === 'redaction') {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        {selected ? (
          <NodeDetails selected={selected} onRefreshHierarchy={refreshTree}/>
        ) : (
          <DefaultPage
            title="Rédaction"
            description="Sélectionnez une collection, une saga ou un tome dans la colonne de gauche."
          />
        )}
      </main>
    )
  }

  if (active === 'characters') {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        {charactersView === 'list' ? (
          <CharactersPage projectId={projectId} />
        ) : charactersView === 'template' ? (
          <CharactersTemplatePage projectId={projectId} />
        ) : (
          <CharacterTagsManagerPage projectId={projectId} />  // ← NEW
        )}
      </main>
    )
  }

  if (active === 'lore-places') {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <PlacesPage projectId={projectId} />
      </main>
    )
  }
  if (active === 'lore-places-tags') {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <PlacesTagsManagerPage projectId={projectId} />
      </main>
    )
  }

  if (active === 'lore-items') {
    return (<main className="flex-1 p-8 overflow-y-auto"><ItemsPage projectId={projectId} /></main>)
  }
  if (active === 'lore-items-tags') {
    return (<main className="flex-1 p-8 overflow-y-auto"><ItemsTagsManagerPage projectId={projectId} /></main>)
  }

  if (active === 'lore-events') {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <EventsPage projectId={projectId} />
      </main>
    )
  }
  if (active === 'lore-events-tags') {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <EventsTagsManagerPage projectId={projectId} />
      </main>
    )
  }

  if (active === 'analytics') {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <AnalyticsPage projectId={projectId} />
      </main>
    )
  }

  if (active === 'chronology') {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <ChronologyPage projectId={projectId} />
      </main>
    )
  }

  if (active === 'game-design-catalog') {
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <GameDesignCatalog
          enabledComponents={enabledGdComponents}
          onAdd={(c) => onAddGameDesignComponent?.(c)}
        />
      </main>
    )
  }

  if (active === 'game-design') {
    if (activeGameDesignComponent === 'map-editor' && activeGdRecordId) {
      return (
        <main className="flex-1 p-4 overflow-hidden flex flex-col">
          <MapEditorPage projectId={projectId} componentRecordId={activeGdRecordId} />
        </main>
      )
    }
    return (
      <main className="flex-1 p-8 overflow-y-auto">
        <DefaultPage
          title="Game Design"
          description="Sélectionnez un composant dans la barre latérale, ou ajoutez-en un avec le bouton +."
        />
      </main>
    )
  }
  
    

  // Autres onglets non implémentés
  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <DefaultPage
        title="Bientôt disponible"
        description="Cette section n'est pas encore implémentée. Revenez bientôt !"
      />
    </main>
  )
}
