import { useState, useEffect, useCallback } from 'react'
import type {
  TicketBoardData,
  TicketTagData, TicketChecklistItemData, TicketPriority,
} from '../../../types/taskBoard'
import type { ProjectMember } from '../../../types/taskBoard'
import { apiGet, apiPost, apiPut, apiDelete } from '../../../utils/fetcher'

export function useTaskBoard(projectId: string) {
  const [board, setBoard] = useState<TicketBoardData | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [b, m] = await Promise.all([
        apiGet<TicketBoardData>(`projects/${projectId}/board`),
        apiGet<ProjectMember[]>(`projects/${projectId}/members`),
      ])
      setBoard(b)
      setMembers(m)
    } catch (err) {
      console.error('Failed to load task board', err)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { reload() }, [reload])

  // ─── Members ───
  const addMember = useCallback(async (name: string, role: string, color: string) => {
    const m = await apiPost<ProjectMember>(`projects/${projectId}/members`, { name, role, color })
    setMembers(prev => [...prev, m])
    return m
  }, [projectId])

  const updateMember = useCallback(async (id: string, data: Partial<{ name: string; role: string; color: string }>) => {
    const m = await apiPut<ProjectMember>(`projects/${projectId}/members/${id}`, data)
    setMembers(prev => prev.map(x => x.id === id ? m : x))
    return m
  }, [projectId])

  const removeMember = useCallback(async (id: string) => {
    await apiDelete(`projects/${projectId}/members/${id}`)
    setMembers(prev => prev.filter(x => x.id !== id))
  }, [projectId])

  // ─── Columns ───
  const addColumn = useCallback(async (name: string, color: string) => {
    await apiPost(`projects/${projectId}/board/columns`, { name, color })
    await reload()
  }, [projectId, reload])

  const updateColumn = useCallback(async (colId: string, data: Partial<{ name: string; color: string; position: number }>) => {
    await apiPut(`projects/${projectId}/board/columns/${colId}`, data)
    await reload()
  }, [projectId, reload])

  const removeColumn = useCallback(async (colId: string) => {
    await apiDelete(`projects/${projectId}/board/columns/${colId}`)
    await reload()
  }, [projectId, reload])

  const reorderColumns = useCallback(async (order: string[]) => {
    const b = await apiPut<TicketBoardData>(`projects/${projectId}/board/columns/reorder`, { order })
    setBoard(b)
  }, [projectId])

  // ─── Tickets ───
  const addTicket = useCallback(async (colId: string, data: {
    title: string; description?: string; priority?: TicketPriority;
    tags?: TicketTagData[]; checklist?: TicketChecklistItemData[]; assigneeIds?: string[]
  }) => {
    await apiPost(`projects/${projectId}/board/columns/${colId}/tickets`, data)
    await reload()
  }, [projectId, reload])

  const updateTicket = useCallback(async (ticketId: string, data: Partial<{
    title: string; description: string; priority: TicketPriority; columnId: string; position: number;
    tags: TicketTagData[]; checklist: TicketChecklistItemData[]; assigneeIds: string[]
  }>) => {
    await apiPut(`projects/${projectId}/board/tickets/${ticketId}`, data)
    await reload()
  }, [projectId, reload])

  const removeTicket = useCallback(async (ticketId: string) => {
    await apiDelete(`projects/${projectId}/board/tickets/${ticketId}`)
    await reload()
  }, [projectId, reload])

  const moveTicket = useCallback(async (ticketId: string, columnId: string, position: number) => {
    await apiPut(`projects/${projectId}/board/tickets/${ticketId}/move`, { columnId, position })
    await reload()
  }, [projectId, reload])

  return {
    board, members, loading, reload,
    addMember, updateMember, removeMember,
    addColumn, updateColumn, removeColumn, reorderColumns,
    addTicket, updateTicket, removeTicket, moveTicket,
  }
}
