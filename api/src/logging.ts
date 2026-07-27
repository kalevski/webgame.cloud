import { ConsoleLogReporter, LoggerFactory } from '@toolcase/logging'
import { DEBUG_SCOPES, LOG_LEVEL } from './env.js'

const factory = new LoggerFactory([new ConsoleLogReporter()])
factory.parseEnv({ LOG_LEVEL, DEBUG: DEBUG_SCOPES })

export const getLogger = (scope: string) => factory.getLogger(scope)

const repoLog = factory.getLogger('repo')

export const repositoryOptions = {
    slowQueryMs: 250,
    logger: {
        debug: (msg: string, meta?: Record<string, unknown>) => repoLog.debug(msg, meta),
        warn: (msg: string, meta?: Record<string, unknown>) => repoLog.warning(msg, meta),
        error: (msg: string, meta?: Record<string, unknown>) => repoLog.error(msg, meta),
    },
}
