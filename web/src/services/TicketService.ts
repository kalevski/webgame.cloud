import { apiFetch } from 'helpers/api'
import {
    Ticket,
    TicketDraft,
    TicketFilters,
    TicketMessage,
    TicketQueueResult,
    TicketStatus,
    TicketThread,
} from 'types'

const query = (filters: TicketFilters): string => {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    if (filters.assigneeId) params.set('assigneeId', filters.assigneeId)
    if (filters.q) params.set('q', filters.q)
    if (filters.limit !== undefined) params.set('limit', String(filters.limit))
    if (filters.offset !== undefined) params.set('offset', String(filters.offset))
    const encoded = params.toString()
    return encoded ? `?${encoded}` : ''
}

class TicketService {
    private static instance: TicketService
    private constructor() {}

    static getInstance(): TicketService {
        if (!TicketService.instance) TicketService.instance = new TicketService()
        return TicketService.instance
    }

    async list(): Promise<Ticket[]> {
        return apiFetch<Ticket[]>('/api/tickets')
    }

    async queue(filters: TicketFilters): Promise<TicketQueueResult> {
        return apiFetch<TicketQueueResult>(`/api/tickets/queue${query(filters)}`)
    }

    async create(draft: TicketDraft): Promise<TicketThread> {
        return apiFetch<TicketThread>('/api/tickets', { method: 'POST', body: JSON.stringify(draft) })
    }

    async thread(id: string): Promise<TicketThread> {
        return apiFetch<TicketThread>(`/api/tickets/${encodeURIComponent(id)}`)
    }

    async reply(id: string, body: string, internal: boolean): Promise<TicketMessage> {
        return apiFetch<TicketMessage>(`/api/tickets/${encodeURIComponent(id)}/messages`, {
            method: 'POST',
            body: JSON.stringify({ body, internal }),
        })
    }

    async update(id: string, patch: { status?: TicketStatus; assigneeId?: string | null }): Promise<Ticket> {
        return apiFetch<Ticket>(`/api/tickets/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(patch),
        })
    }

    async remove(id: string): Promise<void> {
        await apiFetch<void>(`/api/tickets/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }
}

export default TicketService
