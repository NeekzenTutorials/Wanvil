import type { FC } from 'react'
import { useState, useRef } from 'react'
import type {
  TicketBoardData, TicketColumnData, TicketData,
  TicketTagData, TicketChecklistItemData, TicketPriority,
} from '../../../types/taskBoard'
import type { ProjectMember } from '../../../types/taskBoard'
import { TicketCard } from './TicketCard'
import { TicketModal } from './TicketModal'
import { Plus, MoreVertical, Trash2, Pencil } from 'lucide-react'
import { useTranslation } from '../../../i18n'

interface Props {
  board: TicketBoardData
  members: ProjectMember[]
  onAddColumn: (name: string, color: string) => Promise<void>
  onUpdateColumn: (colId: string, data: Partial<{ name: string; color: string; position: number }>) => Promise<void>
  onRemoveColumn: (colId: string) => Promise<void>
  onReorderColumns: (order: string[]) => Promise<void>
  onAddTicket: (colId: string, data: { title: string; description?: string; priority?: TicketPriority; tags?: TicketTagData[]; checklist?: TicketChecklistItemData[]; assigneeIds?: string[] }) => Promise<void>
  onUpdateTicket: (ticketId: string, data: Partial<{ title: string; description: string; priority: TicketPriority; tags: TicketTagData[]; checklist: TicketChecklistItemData[]; assigneeIds: string[] }>) => Promise<void>
  onRemoveTicket: (ticketId: string) => Promise<void>
  onMoveTicket: (ticketId: string, columnId: string, position: number) => Promise<void>
}

const COLUMN_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

export const BoardView: FC<Props> = ({
  board, members,
  onAddColumn, onUpdateColumn, onRemoveColumn,
  onAddTicket, onUpdateTicket, onRemoveTicket, onMoveTicket,
}) => {
  const { t } = useTranslation()
  const [addingCol, setAddingCol] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColColor, setNewColColor] = useState(COLUMN_COLORS[0])
  const [quickAddCol, setQuickAddCol] = useState<string | null>(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [editingCol, setEditingCol] = useState<string | null>(null)
  const [editColName, setEditColName] = useState('')
  const [editColColor, setEditColColor] = useState('')
  const [menuCol, setMenuCol] = useState<string | null>(null)
  const [modalTicket, setModalTicket] = useState<{ ticket: TicketData; column: TicketColumnData } | null>(null)

  // Drag state
  const dragTicketRef = useRef<{ ticketId: string; fromColId: string } | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  const handleAddColumn = async () => {
    if (!newColName.trim()) return
    await onAddColumn(newColName.trim(), newColColor)
    setNewColName('')
    setAddingCol(false)
  }

  const handleQuickAdd = async (colId: string) => {
    if (!quickTitle.trim()) return
    await onAddTicket(colId, { title: quickTitle.trim() })
    setQuickTitle('')
    setQuickAddCol(null)
  }

  const handleDragStart = (ticketId: string, fromColId: string) => {
    dragTicketRef.current = { ticketId, fromColId }
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colId)
  }

  const handleDragLeave = () => {
    setDragOverCol(null)
  }

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault()
    setDragOverCol(null)
    if (!dragTicketRef.current) return
    const { ticketId } = dragTicketRef.current
    const targetCol = board.columns.find(c => c.id === targetColId)
    const position = targetCol?.tickets.length ?? 0
    await onMoveTicket(ticketId, targetColId, position)
    dragTicketRef.current = null
  }

  const startEditCol = (col: TicketColumnData) => {
    setEditingCol(col.id)
    setEditColName(col.name)
    setEditColColor(col.color)
    setMenuCol(null)
  }

  const saveEditCol = async () => {
    if (!editingCol || !editColName.trim()) return
    await onUpdateColumn(editingCol, { name: editColName.trim(), color: editColColor })
    setEditingCol(null)
  }

  const columns = [...board.columns].sort((a, b) => a.position - b.position)

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden">
      <div className="flex gap-4 h-full items-start p-1 min-w-max">
        {columns.map(col => (
          <div
            key={col.id}
            className={`w-80 shrink-0 flex flex-col bg-gray-100 dark:bg-gray-900 rounded-xl border dark:border-gray-700 transition-shadow ${dragOverCol === col.id ? 'ring-2 ring-indigo-400 bg-indigo-50 dark:bg-indigo-950' : ''}`}
            onDragOver={e => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, col.id)}
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b dark:border-gray-700" style={{ borderTopColor: col.color, borderTopWidth: 3, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
              {editingCol === col.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    value={editColName} onChange={e => setEditColName(e.target.value)}
                    className="flex-1 border rounded px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    onKeyDown={e => { if (e.key === 'Enter') saveEditCol(); if (e.key === 'Escape') setEditingCol(null) }}
                    autoFocus
                  />
                  <div className="flex gap-0.5">
                    {COLUMN_COLORS.map(c => (
                      <button key={c} onClick={() => setEditColColor(c)}
                        className={`w-4 h-4 rounded-full border ${editColColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button onClick={saveEditCol} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">OK</button>
                </div>
              ) : (
                <>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                  <span className="font-semibold text-sm flex-1 truncate">{col.name}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 rounded-full px-1.5 py-0.5">{col.tickets.length}</span>
                  <div className="relative">
                    <button onClick={() => setMenuCol(menuCol === col.id ? null : col.id)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 dark:text-gray-500">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                    {menuCol === col.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuCol(null)} />
                        <div className="absolute right-0 top-full z-20 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[140px]">
                          <button onClick={() => startEditCol(col)} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
                            <Pencil className="w-3.5 h-3.5" /> {t('common.modify')}
                          </button>
                          <button onClick={() => { onRemoveColumn(col.id); setMenuCol(null) }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 text-left">
                            <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Tickets */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[60px]">
              {[...col.tickets].sort((a, b) => a.position - b.position).map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  columnColor={col.color}
                  onDragStart={() => handleDragStart(ticket.id, col.id)}
                  onClick={() => setModalTicket({ ticket, column: col })}
                />
              ))}
            </div>

            {/* Quick add */}
            <div className="p-2 border-t dark:border-gray-700">
              {quickAddCol === col.id ? (
                <div className="space-y-2">
                  <input
                    value={quickTitle} onChange={e => setQuickTitle(e.target.value)}
                    placeholder={t('taskBoard.ticketTitle')}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(col.id); if (e.key === 'Escape') { setQuickAddCol(null); setQuickTitle('') } }}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleQuickAdd(col.id)} className="px-3 py-1 bg-indigo-500 text-white rounded text-xs font-medium hover:bg-indigo-600">{t('common.add')}</button>
                    <button onClick={() => { setQuickAddCol(null); setQuickTitle('') }} className="px-3 py-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs">{t('common.cancel')}</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setQuickAddCol(col.id); setQuickTitle('') }}
                  className="w-full flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg px-3 py-2 transition"
                >
                  <Plus className="w-4 h-4" /> {t('taskBoard.addTicket')}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Add column */}
        <div className="w-72 shrink-0">
          {addingCol ? (
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 space-y-3">
              <input
                value={newColName} onChange={e => setNewColName(e.target.value)}
                placeholder={t('taskBoard.columnName')}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleAddColumn(); if (e.key === 'Escape') setAddingCol(false) }}
              />
              <div className="flex gap-1">
                {COLUMN_COLORS.map(c => (
                  <button key={c} onClick={() => setNewColColor(c)}
                    className={`w-5 h-5 rounded-full border-2 ${newColColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddColumn} className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">{t('common.create')}</button>
                <button onClick={() => setAddingCol(false)} className="px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm">{t('common.cancel')}</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingCol(true)}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 border-2 border-dashed dark:border-gray-600 rounded-xl py-8 hover:border-gray-400 dark:hover:border-gray-500 transition"
            >
              <Plus className="w-4 h-4" /> {t('taskBoard.addColumn')}
            </button>
          )}
        </div>
      </div>

      {/* Ticket detail modal */}
      {modalTicket && (
        <TicketModal
          ticket={modalTicket.ticket}
          column={modalTicket.column}
          columns={columns}
          members={members}
          onUpdate={onUpdateTicket}
          onDelete={onRemoveTicket}
          onMove={onMoveTicket}
          onClose={() => setModalTicket(null)}
        />
      )}
    </div>
  )
}
