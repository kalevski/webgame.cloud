import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FeatureFlag } from './contracts/index.js'
import { encodeErrorCause } from './contracts/index.js'
import container from './container.js'
import { FeatureService } from './services/FeatureService.js'

export const requireFeature = (flag: FeatureFlag) =>
    async (request: FastifyRequest, reply: FastifyReply) => {
        if (!(await container.resolve(FeatureService).isEnabled(flag))) {
            reply.code(404).send({ error: encodeErrorCause('feature_disabled', flag) })
            return reply
        }
    }
