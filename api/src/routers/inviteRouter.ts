import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { requireAuth } from '../auth.js'
import container from '../container.js'
import { ProjectService } from '../services/ProjectService.js'
import { sendError } from './sendError.js'
import { recordAudit } from '../audit.js'

const projects = () => container.resolve(ProjectService)

const listInvitesEndpoint = async (request: FastifyRequest) =>
    projects().listInvitesForUser(request.user!)

const acceptInviteEndpoint = async (
    request: FastifyRequest<{ Params: { inviteId: string } }>,
    reply: FastifyReply
) => {
    try {
        const project = await projects().acceptInvite(request.user!, request.params.inviteId)
        void recordAudit(request.user!, 'member.joined', project.id, request.user!.email, request.id)
        return project
    } catch (error) {
        return sendError(reply, error)
    }
}

const declineInviteEndpoint = async (
    request: FastifyRequest<{ Params: { inviteId: string } }>,
    reply: FastifyReply
) => {
    try {
        await projects().declineInvite(request.user!, request.params.inviteId)
        reply.code(204)
        return null
    } catch (error) {
        return sendError(reply, error)
    }
}

export const inviteRouter: FastifyPluginAsync = async (app) => {
    app.addHook('preHandler', requireAuth)

    app.get('/api/invites', listInvitesEndpoint)

    app.post<{ Params: { inviteId: string } }>('/api/invites/:inviteId/accept', acceptInviteEndpoint)

    app.post<{ Params: { inviteId: string } }>('/api/invites/:inviteId/decline', declineInviteEndpoint)
}
