import type { FC } from 'react'
import type { SelectedNode } from '../../types/selectedNodes'
import { NodeDetails } from '../common/NodeDetails'

export const ProjectMain: FC<{ selected: SelectedNode | null, refreshTree: () => void }> = ({ selected, refreshTree }) => (
  <main className="flex-1 p-8 overflow-y-auto">
    {selected ? (
      <NodeDetails selected={selected} onRefreshHierarchy={refreshTree}/>
    ) : (
      <p className="text-gray-500">Sélectionnez une collection, saga ou tome</p>
    )}
  </main>
);