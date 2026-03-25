import type { FC } from 'react'
import type { TicketData } from '../../../types/taskBoard'
import { PRIORITY_CONFIG } from '../../../types/taskBoard'
import { CheckSquare } from 'lucide-react'
import { useTranslation } from '../../../i18n'

interface Props {
  ticket: TicketData
  columnColor: string
  onDragStart: () => void
  onClick: () => void
}

export const TicketCard: FC<Props> = ({ ticket, columnColor, onDragStart, onClick }) => {
  const { t } = useTranslation()
  const prio = PRIORITY_CONFIG[ticket.priority]
  const checkDone = ticket.checklist.filter(c => c.done).length
  const checkTotal = ticket.checklist.length

  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition-all group select-none"
      style={{ borderLeftWidth: 3, borderLeftColor: columnColor }}
    >
      {/* Tags */}
      {ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {ticket.tags.map((tag, i) => (
            <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1 line-clamp-2">{ticket.title}</p>

      {/* Description preview */}
      {ticket.description && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 line-clamp-1">{ticket.description}</p>
      )}

      {/* Footer: priority, checklist, assignees */}
      <div className="flex items-center gap-2 mt-1">
        {/* Priority badge */}
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ color: prio.color, backgroundColor: prio.bg }}>
          {t(prio.label)}
        </span>

        {/* Checklist progress */}
        {checkTotal > 0 && (
          <span className={`flex items-center gap-0.5 text-[10px] ${checkDone === checkTotal ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
            <CheckSquare className="w-3 h-3" />
            {checkDone}/{checkTotal}
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Assignee avatars */}
        {ticket.assignees.length > 0 && (
          <div className="flex -space-x-1.5">
            {ticket.assignees.slice(0, 3).map(a => (
              <div
                key={a.memberId}
                title={a.memberName}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-bold border border-white dark:border-gray-800"
                style={{ backgroundColor: a.memberColor || '#6366f1' }}
              >
                {a.memberName.charAt(0).toUpperCase()}
              </div>
            ))}
            {ticket.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-gray-500 dark:text-gray-400 font-bold bg-gray-200 dark:bg-gray-700 border border-white dark:border-gray-800">
                +{ticket.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
