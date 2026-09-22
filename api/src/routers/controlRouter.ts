import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import container from '../container.js'
import type {
    ControlRunRequest,
    ControlRunResult,
    ControlStatus,
    DemoRequest,
    DemoResult,
    JobSchedule,
} from '../contracts/index.js'
import { DEMO_SCALES } from '../contracts/index.js'
import { DemoDataService } from '../services/DemoDataService.js'
import { HealthService } from '../services/HealthService.js'
import { JobService } from '../services/JobService.js'

const jobs = () => container.resolve(JobService)

const health = () => container.resolve(HealthService)

const demo = () => container.resolve(DemoDataService)

const runSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        kinds: {
            type: 'array',
            items: { type: 'string', minLength: 1, maxLength: 100 },
            maxItems: 50,
        },
    },
} as const

const seedDemoSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        scale: { type: 'string', enum: [...DEMO_SCALES] },
        seed: { type: 'string', minLength: 1, maxLength: 100 },
        force: { type: 'boolean' },
    },
} as const

const statusEndpoint = async (): Promise<ControlStatus> => health().status()

const schedulesEndpoint = async (): Promise<JobSchedule[]> => jobs().listSchedules()

const runEndpoint = async (
    request: FastifyRequest<{ Body: ControlRunRequest | null }>,
    reply: FastifyReply
): Promise<ControlRunResult> => {
    return { triggered: await jobs().runNow(request.body?.kinds ?? []) }
}

const seedDemoEndpoint = async (
    request: FastifyRequest<{ Body: DemoRequest | null }>,
    reply: FastifyReply
): Promise<DemoResult> => {
    return await demo().seed(request.body ?? {})
}

export const controlRouter: FastifyPluginAsync = async (app) => {
    app.get('/control/status', statusEndpoint)

    app.get('/control/jobs', schedulesEndpoint)

    app.post('/control/jobs/run', { schema: { body: runSchema } }, runEndpoint)

    app.post('/control/seed-demo', { schema: { body: seedDemoSchema } }, seedDemoEndpoint)
}
