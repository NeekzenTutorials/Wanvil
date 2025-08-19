import type { FC } from 'react'
import type { SidebarSections, CharactersSubView } from '../../types/sidebarSections'
import type { SelectedNode } from '../../types/selectedNodes'
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

interface Props {
  active: SidebarSections
  charactersView: CharactersSubView
  selected: SelectedNode | null
  refreshTree: () => void
  projectId: string
}

export const ProjectMain: FC<Props> = ({ active, charactersView, selected, refreshTree, projectId }) => {
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
