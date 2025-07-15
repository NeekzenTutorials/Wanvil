import type { FC } from 'react'

interface HierarchyProps {
  onSelect: (id: string) => void
}

const Hierarchy: FC<HierarchyProps> = ({ onSelect }) => {
  // TODO: fetch nodes from store or IndexedDB
  const mockNodes = [
    { id: 'c1', title: 'Collection 1' },
    { id: 's1', title: 'Saga 1' },
    { id: 't1', title: 'Tome 1' },
    { id: 'ch1', title: 'Chapitre 1' },
  ]

  return (
    <ul className="space-y-2">
      {mockNodes.map(node => (
        <li key={node.id}>
          <button
            className="text-left w-full text-gray-700 hover:text-blue-600"
            onClick={() => onSelect(node.id)}
          >
            {node.title}
          </button>
        </li>
      ))}
    </ul>
  )
}

export default Hierarchy