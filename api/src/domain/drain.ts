import { Async } from '@toolcase/base'

const POLL_MS = 50

export const DRAIN_TIMEOUT_MS = 10_000

export const drain = async (busy: () => boolean, timeoutMs = DRAIN_TIMEOUT_MS): Promise<boolean> => {
    const deadline = Date.now() + timeoutMs
    while (busy()) {
        if (Date.now() >= deadline) return false
        await Async.sleep(POLL_MS)
    }
    return true
}
