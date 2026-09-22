import { useEffect } from 'react'

type SheetEntry = {
    close: () => void
}

const open = new Set<SheetEntry>()

let listening = false
let scheduled = false
let guardFrom: string | null = null
let selfPops = 0

const here = (): string => window.location.pathname + window.location.search

const onPopState = () => {
    if (selfPops > 0) {
        selfPops -= 1
        return
    }
    guardFrom = null
    const closing = [...open]
    open.clear()
    for (const entry of closing) entry.close()
}

const sync = () => {
    scheduled = false

    if (open.size > 0 && guardFrom === null) {
        if (!listening) {
            window.addEventListener('popstate', onPopState)
            listening = true
        }
        guardFrom = here()

        const current = (window.history.state ?? {}) as Record<string, unknown>
        window.history.pushState({ ...current, sheet: true }, '')
        return
    }

    if (open.size === 0 && guardFrom !== null) {
        const from = guardFrom
        guardFrom = null

        if (here() !== from) return

        selfPops += 1
        window.history.back()
    }
}

const schedule = () => {
    if (scheduled) return
    scheduled = true
    queueMicrotask(sync)
}

export const useSheetHistory = (isOpen: boolean, close: () => void): void => {
    useEffect(() => {
        if (!isOpen) return
        const entry: SheetEntry = { close }
        open.add(entry)
        schedule()
        return () => {
            open.delete(entry)
            schedule()
        }
    }, [isOpen, close])
}

export default useSheetHistory

export const consume = (): void => {
    if (guardFrom === null) return
    guardFrom = null
    open.clear()
}

