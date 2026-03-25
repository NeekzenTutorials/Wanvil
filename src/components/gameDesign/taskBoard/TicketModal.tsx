import type { FC } from 'react'
import { useState } from 'react'
import type {
  TicketData, TicketColumnData, TicketTagData,
  TicketChecklistItemData, TicketPriority,
} from '../../../types/taskBoard'
import type { ProjectMember } from '../../../types/taskBoard'
import { PRIORITY_CONFIG } from '../../../types/taskBoard'
import {
  X, Trash2, Plus, Check, ChevronDown,
  CheckSquare, Square, Tag, Users, Flag, AlignLeft, ListChecks, ArrowRightLeft,
} from 'lucide-react'
import { useTranslation } from '../../../i18n'

const TAG_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b']

interface Props {
  ticket: TicketData
  column: TicketColumnData
  columns: TicketColumnData[]
  members: ProjectMember[]
  onUpdate: (ticketId: string, data: Record<string, unknown>) => Promise<void>
  onDelete: (ticketId: string) => Promise<void>
  onMove: (ticketId: string, columnId: string, position: number) => Promise<void>
  onClose: () => void
}

export const TicketModal: FC<Props> = ({ ticket, column, columns, members, onUpdate, onDelete, onMove, onClose }) => {
  const { t } = useTranslation()
  const [title, setTitle] = useState(ticket.title)
  const [description, setDescription] = useState(ticket.description)
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority)
  const [tags, setTags] = useState<TicketTagData[]>(ticket.tags)
  const [checklist, setChecklist] = useState<TicketChecklistItemData[]>(ticket.checklist)
  const [assigneeIds, setAssigneeIds] = useState<string[]>(ticket.assignees.map(a => a.memberId))
  const [dirty, setDirty] = useState(false)

  // Tag add state
  const [showTagAdd, setShowTagAdd] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0])

  // Checklist add state
  const [newCheckText, setNewCheckText] = useState('')

  // Move state
  const [showMove, setShowMove] = useState(false)

  const markDirty = () => setDirty(true)

  const handleSave = async () => {
    await onUpdate(ticket.id, {
      title: title.trim(),
      description,
      priority,
      tags: tags.map(tag => ({ name: tag.name, color: tag.color })),
      checklist: checklist.map((c, i) => ({ text: c.text, done: c.done, position: i })),
      assigneeIds,
    })
    setDirty(false)
    onClose()
  }

  const handleDelete = async () => {
    await onDelete(ticket.id)
    onClose()
  }

  const toggleCheck = (idx: number) => {
    setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, done: !c.done } : c))
    markDirty()
  }

  const addCheckItem = () => {
    if (!newCheckText.trim()) return
    setChecklist(prev => [...prev, { text: newCheckText.trim(), done: false, position: prev.length }])
    setNewCheckText('')
    markDirty()
  }

  const removeCheckItem = (idx: number) => {
    setChecklist(prev => prev.filter((_, i) => i !== idx))
    markDirty()
  }

  const addTag = () => {
    if (!newTagName.trim()) return
    setTags(prev => [...prev, { name: newTagName.trim(), color: newTagColor }])
    setNewTagName('')
    setShowTagAdd(false)
    markDirty()
  }

  const removeTag = (idx: number) => {
    setTags(prev => prev.filter((_, i) => i !== idx))
    markDirty()
  }

  const toggleAssignee = (mid: string) => {
    setAssigneeIds(prev => prev.includes(mid) ? prev.filter(x => x !== mid) : [...prev, mid])
    markDirty()
  }

  const handleMove = async (targetColId: string) => {
    const targetCol = columns.find(c => c.id === targetColId)
    await onMove(ticket.id, targetColId, targetCol?.tickets.length ?? 0)
    setShowMove(false)
    onClose()
  }

  const checkDone = checklist.filter(c => c.done).length
  const checkTotal = checklist.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center gap-3 z-10 rounded-t-2xl">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase">{column.name}</span>
          <div className="flex-1" />
          <button onClick={onClose} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Title */}
          <input
            value={title}
            onChange={e => { setTitle(e.target.value); markDirty() }}
            className="w-full text-xl font-bold border-none focus:outline-none focus:ring-0 placeholder:text-gray-300 dark:bg-transparent dark:text-gray-100 dark:placeholder:text-gray-600"
            placeholder={t('taskBoard.ticketTitleLabel')}
          />

          {/* Priority */}
          <div className="flex items-center gap-3">
            <Flag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400 w-20">{t('taskBoard.priority')}</span>
            <div className="flex gap-1.5">
              {(Object.keys(PRIORITY_CONFIG) as TicketPriority[]).map(p => {
                const cfg = PRIORITY_CONFIG[p]
                const isActive = priority === p
                return (
                  <button
                    key={p}
                    onClick={() => { setPriority(p); markDirty() }}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${isActive ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'}`}
                    style={{ color: cfg.color, backgroundColor: cfg.bg, ...(isActive ? { ringColor: cfg.color } : {}) }}
                  >
                    {t(cfg.label)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Move to column */}
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400 w-20">{t('taskBoard.column')}</span>
            <div className="relative">
              <button
                onClick={() => setShowMove(!showMove)}
                className="flex items-center gap-1.5 text-sm border dark:border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100"
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                {column.name}
                <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              </button>
              {showMove && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMove(false)} />
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg py-1 z-20 min-w-[160px]">
                    {columns.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleMove(c.id)}
                        disabled={c.id === column.id}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left ${c.id === column.id ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('taskBoard.tags')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag, i) => (
                <span key={i} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-white" style={{ backgroundColor: tag.color }}>
                  {tag.name}
                  <button onClick={() => removeTag(i)} className="hover:opacity-70"><X className="w-3 h-3" /></button>
                </span>
              ))}
              {!showTagAdd && (
                <button onClick={() => setShowTagAdd(true)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 border border-dashed dark:border-gray-600 rounded-full px-2 py-1 flex items-center gap-1">
                  <Plus className="w-3 h-3" /> {t('taskBoard.tag')}
                </button>
              )}
            </div>
            {showTagAdd && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-2">
                <input
                  value={newTagName} onChange={e => setNewTagName(e.target.value)}
                  placeholder={t('taskBoard.tagName')}
                  className="flex-1 border rounded px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') setShowTagAdd(false) }}
                  autoFocus
                />
                <div className="flex gap-0.5">
                  {TAG_COLORS.map(c => (
                    <button key={c} onClick={() => setNewTagColor(c)}
                      className={`w-4 h-4 rounded-full border ${newTagColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button onClick={addTag} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">OK</button>
                <button onClick={() => setShowTagAdd(false)} className="text-xs text-gray-400 dark:text-gray-500">×</button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('taskBoard.description')}</span>
            </div>
            <textarea
              value={description}
              onChange={e => { setDescription(e.target.value); markDirty() }}
              rows={4}
              className="w-full border dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none resize-y dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('taskBoard.descPlaceholder')}
            />
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('taskBoard.checklist')}</span>
              {checkTotal > 0 && (
                <span className={`text-xs ${checkDone === checkTotal ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {checkDone}/{checkTotal}
                </span>
              )}
            </div>
            {/* Progress bar */}
            {checkTotal > 0 && (
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all bg-green-500"
                  style={{ width: `${checkTotal > 0 ? (checkDone / checkTotal) * 100 : 0}%` }}
                />
              </div>
            )}
            <div className="space-y-1 mb-2">
              {checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 group">
                  <button onClick={() => toggleCheck(idx)} className="shrink-0">
                    {item.done
                      ? <CheckSquare className="w-4 h-4 text-green-500" />
                      : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                  </button>
                  <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{item.text}</span>
                  <button onClick={() => removeCheckItem(idx)} className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950 text-gray-300 dark:text-gray-600 hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={newCheckText} onChange={e => setNewCheckText(e.target.value)}
                placeholder={t('taskBoard.addCheckItem')}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                onKeyDown={e => e.key === 'Enter' && addCheckItem()}
              />
              <button onClick={addCheckItem} disabled={!newCheckText.trim()} className="text-sm text-indigo-600 dark:text-indigo-400 font-medium disabled:opacity-40">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Assignees */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('taskBoard.assigned')}</span>
            </div>
            {members.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">{t('taskBoard.noMembersHint')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const assigned = assigneeIds.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleAssignee(m.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border transition ${assigned ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: m.color || '#6366f1' }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-xs ${assigned ? 'text-indigo-700 dark:text-indigo-300 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{m.name}</span>
                      {assigned && <Check className="w-3 h-3 text-indigo-500" />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-6 py-3 flex items-center gap-3 rounded-b-2xl">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" /> {t('common.delete')}
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">{t('common.cancel')}</button>
          <button
            onClick={handleSave}
            disabled={!dirty || !title.trim()}
            className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
