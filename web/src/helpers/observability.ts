export type ErrorContext = {
    source: string
    detail?: Record<string, unknown>
}

export type ErrorReporter = (error: unknown, context: ErrorContext) => void

const consoleReporter: ErrorReporter = (error, context) => {
    console.error(`[${context.source}]`, error, context.detail ?? {})
}

let reporter: ErrorReporter = consoleReporter

export const registerErrorReporter = (next: ErrorReporter): void => {
    reporter = next
}

export const reportError = (error: unknown, context: ErrorContext): void => {
    try {
        reporter(error, context)
    } catch {
    }
}

export const captureGlobalErrors = (): void => {
    window.addEventListener('error', (event) => {
        reportError(event.error ?? event.message, { source: 'window.error' })
    })
    window.addEventListener('unhandledrejection', (event) => {
        reportError(event.reason, { source: 'unhandledrejection' })
    })
}
