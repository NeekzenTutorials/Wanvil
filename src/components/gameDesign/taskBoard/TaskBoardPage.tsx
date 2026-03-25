import type { FC } from 'react'
import { useTaskBoard } from './useTaskBoard'
import { BoardView } from './BoardView'
import { MembersPanel } from './MembersPanel'
import { useState } from 'react'
import { Users, LayoutDashboard } from 'lucide-react'
import { useTranslation } from '../../../i18n'

interface Props {
  projectId: string
  componentRecordId: string
}

export const TaskBoardPage: FC<Props> = ({ projectId }) => {
  const { t } = useTranslation()
  const tb = useTaskBoard(projectId)
  const [tab, setTab] = useState<'board' | 'members'>('board')

  if (tb.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Tab bar */}
      <div className="flex items-center gap-2 border-b dark:border-gray-700 pb-2">
        <button
          onClick={() => setTab('board')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === 'board' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <LayoutDashboard className="w-4 h-4" /> {t('taskBoard.board')}
        </button>
        <button
          onClick={() => setTab('members')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${tab === 'members' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <Users className="w-4 h-4" /> {t('taskBoard.members')} ({tb.members.length})
        </button>
      </div>

      {tab === 'board' && tb.board && (
        <BoardView
          board={tb.board}
          members={tb.members}
          onAddColumn={tb.addColumn}
          onUpdateColumn={tb.updateColumn}
          onRemoveColumn={tb.removeColumn}
          onReorderColumns={tb.reorderColumns}
          onAddTicket={tb.addTicket}
          onUpdateTicket={tb.updateTicket}
          onRemoveTicket={tb.removeTicket}
          onMoveTicket={tb.moveTicket}
        />
      )}

      {tab === 'members' && (
        <MembersPanel
          members={tb.members}
          onAdd={tb.addMember}
          onUpdate={tb.updateMember}
          onRemove={tb.removeMember}
        />
      )}
    </div>
  )
}
