import { getLogger } from '../logging.js'

const log = getLogger('error')

export type ErrorContext = {
    source: string
    requestId?: string
    detail?: Record<string, unknown>
}

export type ErrorReporter = (error: unknown, context: ErrorContext) => void

const logReporter: ErrorReporter = (error, context) => {
    log.error(context.source, { requestId: context.requestId ?? '', ...context.detail, error: String(error) })
}

let reporter: ErrorReporter = logReporter

export const registerErrorReporter = (next: ErrorReporter): void => {
    reporter = next
}

export const reportError = (error: unknown, context: ErrorContext): void => {
    try {
        reporter(error, context)
    } catch {
    }
}
