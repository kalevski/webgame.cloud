import { StateCreator } from 'zustand'
import TicketService from 'services/TicketService'
import { STRINGS } from 'configs/strings'
import {
    Ticket,
    TicketDraft,
    TicketFilters,
    TicketQueueResult,
    TicketStatus,
    TicketThread,
} from 'types'
import type { AppStore } from './index'

export type TicketsSlice = {
    tickets: Ticket[]
    ticketsLoaded: boolean

    ticketQueue: Ticket[]
    ticketQueueTotal: number
    ticketQueueCounts: TicketQueueResult['counts'] | null
    ticketQueueLoading: boolean
    ticketFilters: TicketFilters

    ticketThread: TicketThread | null
    ticketThreadLoading: boolean

    fetchTickets: () => Promise<void>
    fetchTicketQueue: (patch?: TicketFilters) => Promise<void>
    fetchTicketThread: (id: string) => Promise<void>
    createTicket: (draft: TicketDraft) => Promise<Ticket | null>
    replyToTicket: (id: string, body: string, internal: boolean) => Promise<boolean>
    updateTicket: (id: string, patch: { status?: TicketStatus; assigneeId?: string | null }) => Promise<boolean>
    deleteTicket: (id: string) => Promise<boolean>
}

const PAGE_SIZE = 25

const fail = (get: () => AppStore, error: unknown, fallback: string) =>
    get().addAlert({
        variant: 'danger',
        message: error instanceof Error ? error.message : fallback,
        dismissible: true,
    })

export const createTicketsSlice: StateCreator<AppStore, [], [], TicketsSlice> = (set, get) => ({
    tickets: [],
    ticketsLoaded: false,

    ticketQueue: [],
    ticketQueueTotal: 0,
    ticketQueueCounts: null,
    ticketQueueLoading: false,
    ticketFilters: { limit: PAGE_SIZE, offset: 0 },

    ticketThread: null,
    ticketThreadLoading: false,

    async fetchTickets() {
        try {
            set({ tickets: await TicketService.getInstance().list(), ticketsLoaded: true })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        }
    },

    async fetchTicketQueue(patch = {}) {
        const filters = { ...get().ticketFilters, ...patch }
        set({ ticketFilters: filters, ticketQueueLoading: true })
        try {
            const result = await TicketService.getInstance().queue(filters)
            set({
                ticketQueue: result.tickets,
                ticketQueueTotal: result.total,
                ticketQueueCounts: result.counts,
            })
        } catch (error) {
            fail(get, error, STRINGS.common.loadFailed)
        } finally {
            set({ ticketQueueLoading: false })
        }
    },

    async fetchTicketThread(id) {
        set({ ticketThreadLoading: true })
        try {
            set({ ticketThread: await TicketService.getInstance().thread(id) })
        } catch (error) {
            set({ ticketThread: null })
            fail(get, error, STRINGS.common.loadFailed)
        } finally {
            set({ ticketThreadLoading: false })
        }
    },

    async createTicket(draft) {
        try {
            const thread = await TicketService.getInstance().create(draft)
            await get().fetchTickets()
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.tickets.created, dismissible: true })
            return thread.ticket
        } catch (error) {
            fail(get, error, STRINGS.tickets.saveFailed)
            return null
        }
    },

    async replyToTicket(id, body, internal) {
        try {
            await TicketService.getInstance().reply(id, body, internal)
            await get().fetchTicketThread(id)
            return true
        } catch (error) {
            fail(get, error, STRINGS.tickets.saveFailed)
            return false
        }
    },

    async updateTicket(id, patch) {
        try {
            const updated = await TicketService.getInstance().update(id, patch)
            set({
                tickets: get().tickets.map((ticket) => (ticket.id === id ? updated : ticket)),
                ticketQueue: get().ticketQueue.map((ticket) => (ticket.id === id ? updated : ticket)),
            })
            const thread = get().ticketThread
            if (thread && thread.ticket.id === id) set({ ticketThread: { ...thread, ticket: updated } })
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.tickets.saved, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.tickets.saveFailed)
            return false
        }
    },

    async deleteTicket(id) {
        try {
            await TicketService.getInstance().remove(id)
            set({
                tickets: get().tickets.filter((ticket) => ticket.id !== id),
                ticketQueue: get().ticketQueue.filter((ticket) => ticket.id !== id),
            })
            void get().refreshSession()
            get().addAlert({ variant: 'success', message: STRINGS.tickets.deleted, dismissible: true })
            return true
        } catch (error) {
            fail(get, error, STRINGS.tickets.saveFailed)
            return false
        }
    },
})
