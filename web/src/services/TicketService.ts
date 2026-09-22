import { apiFetch } from 'helpers/api'
import { queryString } from 'helpers/query'
import {
    Ticket,
    TicketDraft,
    TicketFilters,
    TicketMessage,
    TicketQueueResult,
    TicketStatus,
    TicketThread,
} from 'types'

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
        return apiFetch<TicketQueueResult>(`/api/tickets/queue${queryString(filters)}`)
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
