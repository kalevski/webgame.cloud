import 'reflect-metadata'

import container from './container.js'
import { Database } from './Database.js'
import { AccessPolicyService } from './services/AccessPolicyService.js'
import { SigningKeyService } from './services/SigningKeyService.js'
import { Http } from './http.js'
import { MaintenanceService } from './services/MaintenanceService.js'
import { EmailWorker } from './services/EmailWorker.js'
import { JobWorker } from './services/JobWorker.js'
import { PurgeWorker } from './services/PurgeWorker.js'
import { registerJobHandlers } from './jobs.js'
import { FeatureService } from './services/FeatureService.js'
import { getLogger } from './logging.js'

const log = getLogger('boot')

const database = container.resolve(Database)
const http = container.resolve(Http)
const maintenance = container.resolve(MaintenanceService)
const emailWorker = container.resolve(EmailWorker)
const jobWorker = container.resolve(JobWorker)
const purgeWorker = container.resolve(PurgeWorker)

await database.init()
await container.resolve(AccessPolicyService).init()
await container.resolve(SigningKeyService).init()
await http.init()

await emailWorker.init()

registerJobHandlers()
await maintenance.init()
await jobWorker.init()
await purgeWorker.init()
if (!(await container.resolve(FeatureService).isEnabled('email'))) {
    log.info('email feature disabled, worker idles until the flag is turned on')
}

let shuttingDown = false
const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    try {
        log.info(`received ${signal}, shutting down`)
        await purgeWorker.dispose()
        await jobWorker.dispose()
        await emailWorker.dispose()
        await maintenance.dispose()
        await http.dispose()
        await database.dispose()
    } catch (error) {
        log.error('shutdown error', error)
    }
    process.exit(0)
}
process.on('SIGINT', () => { void shutdown('SIGINT') })
process.on('SIGTERM', () => { void shutdown('SIGTERM') })

try {
    await http.run()
} catch (error) {
    log.error('failed to start', error)
    process.exit(1)
}
