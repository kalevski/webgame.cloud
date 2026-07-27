import { CronExpressionParser } from 'cron-parser'

export type JobContext = {
    id: string
    kind: string
    attempts: number
}

export type JobHandler = (payload: Record<string, unknown>, context: JobContext) => Promise<void>

export type JobRegistration = {
    kind: string

    handler: JobHandler

    cron: string

    description: string
}

export type JobHandlerOptions = {
    cron?: string

    description?: string
}

const handlers = new Map<string, JobRegistration>()

export const assertValidCron = (cron: string): void => {
    CronExpressionParser.parse(cron)
}

export const registerJobHandler = (
    kind: string,
    handler: JobHandler,
    options: JobHandlerOptions = {}
): void => {
    if (options.cron) assertValidCron(options.cron)
    handlers.set(kind, {
        kind,
        handler,
        cron: options.cron ?? '',
        description: options.description ?? '',
    })
}

export const getJobHandler = (kind: string): JobHandler | undefined => handlers.get(kind)?.handler

export const jobKinds = (): string[] => [...handlers.keys()].sort()

export const jobRegistrations = (): JobRegistration[] =>
    [...handlers.values()].sort((first, second) => first.kind.localeCompare(second.kind))

export const scheduledRegistrations = (): JobRegistration[] =>
    jobRegistrations().filter((registration) => registration.cron !== '')

export const nextRun = (cron: string, from: Date = new Date()): Date | null => {
    try {
        return CronExpressionParser.parse(cron, { currentDate: from }).next().toDate()
    } catch {
        return null
    }
}

export const previousRun = (cron: string, from: Date = new Date()): Date | null => {
    try {
        return CronExpressionParser.parse(cron, { currentDate: from }).prev().toDate()
    } catch {
        return null
    }
}
