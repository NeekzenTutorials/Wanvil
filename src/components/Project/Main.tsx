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
import { TaskBoardPage } from '../gameDesign/taskBoard/TaskBoardPage'
import { GameDesignCatalog } from '../gameDesign/GameDesignCatalog'
import SettingsPage from '../settings/SettingsPage'
import { useTranslation } from '../../i18n'

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
  gddEnabled?: boolean
  onToggleGdd?: () => void
  onEditGdd?: () => void
  onViewGdd?: () => void
}

export const ProjectMain: FC<Props> = ({ active, charactersView, selected, refreshTree, projectId, activeGameDesignComponent, activeGdRecordId, enabledGdComponents = [], onAddGameDesignComponent, gddEnabled, onToggleGdd, onEditGdd, onViewGdd }) => {
  const { t } = useTranslation()

  if (active === 'settings') {
    return (
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
        <SettingsPage
          gddEnabled={gddEnabled}
          onToggleGdd={onToggleGdd}
          onEditGdd={onEditGdd}
          onViewGdd={onViewGdd}
        />
      </main>
    )
  }

  if (active === 'redaction') {
    return (
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
        {selected ? (
          <NodeDetails selected={selected} onRefreshHierarchy={refreshTree}/>
        ) : (
          <DefaultPage
            title={t('main.writingTitle')}
            description={t('main.writingDesc')}
          />
        )}
      </main>
    )
  }

  if (active === 'characters') {
    return (
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
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
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
        <PlacesPage projectId={projectId} />
      </main>
    )
  }
  if (active === 'lore-places-tags') {
    return (
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
        <PlacesTagsManagerPage projectId={projectId} />
      </main>
    )
  }

  if (active === 'lore-items') {
    return (<main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900"><ItemsPage projectId={projectId} /></main>)
  }
  if (active === 'lore-items-tags') {
    return (<main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900"><ItemsTagsManagerPage projectId={projectId} /></main>)
  }

  if (active === 'lore-events') {
    return (
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
        <EventsPage projectId={projectId} />
      </main>
    )
  }
  if (active === 'lore-events-tags') {
    return (
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
        <EventsTagsManagerPage projectId={projectId} />
      </main>
    )
  }

  if (active === 'analytics') {
    return (
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
        <AnalyticsPage projectId={projectId} />
      </main>
    )
  }

  if (active === 'chronology') {
    return (
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
        <ChronologyPage projectId={projectId} />
      </main>
    )
  }

  if (active === 'game-design-catalog') {
    return (
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
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
        <main className="flex-1 p-4 overflow-hidden flex flex-col dark:bg-gray-900">
          <MapEditorPage projectId={projectId} componentRecordId={activeGdRecordId} />
        </main>
      )
    }
    if (activeGameDesignComponent === 'task-board' && activeGdRecordId) {
      return (
        <main className="flex-1 p-4 overflow-hidden flex flex-col dark:bg-gray-900">
          <TaskBoardPage projectId={projectId} componentRecordId={activeGdRecordId} />
        </main>
      )
    }
    return (
      <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
        <DefaultPage
          title={t('main.gameDesignTitle')}
          description={t('main.gameDesignDesc')}
        />
      </main>
    )
  }
  
    

  // Autres onglets non implémentés
  return (
    <main className="flex-1 p-8 overflow-y-auto dark:bg-gray-900">
      <DefaultPage
        title={t('main.comingSoonTitle')}
        description={t('main.comingSoonDesc')}
      />
    </main>
  )
}
