import { inject, injectable } from 'tsyringe'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { ApiKey, ApiKeyDraft, ApiKeyIssued, Permission, User } from '../contracts/index.js'
import { PERMISSIONS } from '../contracts/index.js'
import { NotFoundError, ValidationError } from '../domain/errors.js'
import { AuthTokenRepository, type ApiKeyRow } from '../repositories/auth/AuthTokenRepository.js'
import { UserRepository } from '../repositories/users/UserRepository.js'

const PREFIX = 'ak'

export const hashApiKey = (token: string): string => createHash('sha256').update(token).digest('hex')

const toApiKey = (row: ApiKeyRow): ApiKey => ({
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    scopes: row.scopes ?? [],
    lastUsedAt: row.last_used_at?.toISOString() ?? null,
    expiresAt: row.expires_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
})

@injectable()
export class ApiKeyService {
    constructor(
        @inject(AuthTokenRepository) private tokens: AuthTokenRepository,
        @inject(UserRepository) private users: UserRepository
    ) {}

    async list(ownerId: string): Promise<ApiKey[]> {
        return (await this.tokens.listApiKeys(ownerId)).map(toApiKey)
    }

    async create(ownerId: string, draft: ApiKeyDraft): Promise<ApiKeyIssued> {
        const name = draft.name?.trim() ?? ''
        if (!name) throw new ValidationError('api_key_name_required', 'a name is required')

        const scopes = (draft.scopes ?? []).filter(
            (scope): scope is Permission => (PERMISSIONS as readonly string[]).includes(scope)
        )

        const secret = randomBytes(24).toString('base64url')
        const id = randomUUID()
        const prefix = `${PREFIX}_${id.slice(0, 8)}`
        const token = `${prefix}.${secret}`

        const row = await this.tokens.insertApiKey({
            id,
            ownerId,
            name: name.slice(0, 80),
            prefix,
            tokenHash: hashApiKey(token),
            scopes,
            expiresAt: draft.expiresAt ? new Date(draft.expiresAt) : null,
        })

        return { key: toApiKey(row), token }
    }

    async revoke(ownerId: string, id: string): Promise<void> {
        const removed = await this.tokens.revokeApiKey(id, ownerId)
        if (!removed) throw new NotFoundError('api_key_not_found', 'api key not found', [id])
    }

    async resolve(token: string): Promise<{ user: User; scopes: Permission[] } | null> {
        const row = await this.tokens.findApiKey(hashApiKey(token))
        if (!row) return null

        const user = await this.users.findById(row.owner_id)
        if (!user || !user.active) return null

        void this.tokens.touchApiKey(row.id)
        return { user, scopes: (row.scopes ?? []) as Permission[] }
    }
}
