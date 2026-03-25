import type { TranslationKey } from '../i18n'

// ─── Task Board (Ticket System) types ───

export interface ProjectMember {
  id: string
  projectId: string
  name: string
  role: string | null
  color: string | null
  createdAt: string | null
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface TicketTagData {
  id?: string
  ticketId?: string
  name: string
  color: string
}

export interface TicketChecklistItemData {
  id?: string
  ticketId?: string
  text: string
  done: boolean
  position: number
}

export interface TicketAssigneeData {
  ticketId: string
  memberId: string
  memberName: string
  memberColor: string | null
}

export interface TicketData {
  id: string
  columnId: string
  title: string
  description: string
  priority: TicketPriority
  position: number
  tags: TicketTagData[]
  checklist: TicketChecklistItemData[]
  assignees: TicketAssigneeData[]
  createdAt: string | null
  updatedAt: string | null
}

export interface TicketColumnData {
  id: string
  boardId: string
  name: string
  color: string
  position: number
  tickets: TicketData[]
  createdAt: string | null
}

export interface TicketBoardData {
  id: string
  projectId: string
  columns: TicketColumnData[]
  createdAt: string | null
}

export const PRIORITY_CONFIG: Record<TicketPriority, { label: TranslationKey; color: string; bg: string }> = {
  low:      { label: 'taskBoard.priority.low',      color: '#6b7280', bg: '#f3f4f6' },
  medium:   { label: 'taskBoard.priority.medium',   color: '#f59e0b', bg: '#fef3c7' },
  high:     { label: 'taskBoard.priority.high',     color: '#f97316', bg: '#ffedd5' },
  critical: { label: 'taskBoard.priority.critical', color: '#ef4444', bg: '#fee2e2' },
}
