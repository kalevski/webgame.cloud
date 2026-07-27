import type { FastifyReply } from 'fastify'
import { AppError } from '../domain/errors.js'
import { encodeErrorCause } from '../contracts/index.js'

export const sendError = (reply: FastifyReply, error: unknown): never | { error: string } => {
    if (error instanceof AppError) {
        reply.code(error.status)

        return { error: encodeErrorCause(error.code, ...error.params) }
    }
    throw error
}
