import type { FC } from 'react'
import { useState } from 'react'
import type { ProjectMember } from '../../../types/taskBoard'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useTranslation } from '../../../i18n'

const COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b']

interface Props {
  members: ProjectMember[]
  onAdd: (name: string, role: string, color: string) => Promise<ProjectMember>
  onUpdate: (id: string, data: Partial<{ name: string; role: string; color: string }>) => Promise<ProjectMember>
  onRemove: (id: string) => Promise<void>
}

export const MembersPanel: FC<Props> = ({ members, onAdd, onUpdate, onRemove }) => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleAdd = async () => {
    if (!name.trim()) return
    await onAdd(name.trim(), role.trim(), color)
    setName('')
    setRole('')
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)])
  }

  const startEdit = (m: ProjectMember) => {
    setEditId(m.id)
    setEditName(m.name)
    setEditRole(m.role || '')
    setEditColor(m.color || COLORS[0])
  }

  const saveEdit = async () => {
    if (!editId || !editName.trim()) return
    await onUpdate(editId, { name: editName.trim(), role: editRole.trim(), color: editColor })
    setEditId(null)
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">{t('taskBoard.membersTitle')}</h3>

      {/* Add form */}
      <div className="flex items-end gap-3 mb-6 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('common.name')}</label>
          <input
            value={name} onChange={e => setName(e.target.value)}
            placeholder={t('taskBoard.memberNamePlaceholder')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('taskBoard.memberRole')}</label>
          <input
            value={role} onChange={e => setRole(e.target.value)}
            placeholder={t('taskBoard.memberRolePlaceholder')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">{t('common.color')}</label>
          <div className="flex gap-1">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition ${color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={handleAdd}
          disabled={!name.trim()}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> {t('common.add')}
        </button>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {members.map(m => (
          <div key={m.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl px-4 py-3 group hover:shadow-sm transition">
            {editId === m.id ? (
              <>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: editColor }}>
                  {editName.charAt(0).toUpperCase()}
                </div>
                <input value={editName} onChange={e => setEditName(e.target.value)} className="border rounded px-2 py-1 text-sm flex-1 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" />
                <input value={editRole} onChange={e => setEditRole(e.target.value)} className="border rounded px-2 py-1 text-sm flex-1 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" placeholder={t('taskBoard.memberRole')} />
                <div className="flex gap-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setEditColor(c)}
                      className={`w-5 h-5 rounded-full border-2 ${editColor === c ? 'border-gray-800' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button onClick={saveEdit} className="p-1.5 rounded hover:bg-green-100 dark:hover:bg-green-900 text-green-600"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditId(null)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: m.color || '#6366f1' }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.name}</p>
                  {m.role && <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{m.role}</p>}
                </div>
                <button onClick={() => startEdit(m)} className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 transition-opacity"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => onRemove(m.id)} className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
              </>
            )}
          </div>
        ))}
        {members.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-8">{t('taskBoard.noMembers')}</p>
        )}
      </div>
    </div>
  )
}
