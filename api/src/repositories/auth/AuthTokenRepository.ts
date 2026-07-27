import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'

import CONSUME_LOGIN_TOKEN from './sql/consume-login-token.sql'
import FIND_API_KEY from './sql/find-api-key.sql'
import INSERT_API_KEY from './sql/insert-api-key.sql'
import INSERT_LOGIN_TOKEN from './sql/insert-login-token.sql'
import PURGE_LOGIN_TOKENS from './sql/purge-login-tokens.sql'
import REVOKE_API_KEY from './sql/revoke-api-key.sql'
import SELECT_API_KEYS from './sql/select-api-keys.sql'
import TOUCH_API_KEY from './sql/touch-api-key.sql'

export type LoginTokenRow = {
    id: string
    email: string
    token_hash: string
    ip: string
    expires_at: Date
    consumed_at: Date | null
    created_at: Date
}

export type ApiKeyRow = {
    id: string
    owner_id: string
    name: string
    prefix: string
    token_hash: string
    scopes: string[]
    last_used_at: Date | null
    expires_at: Date | null
    revoked_at: Date | null
    created_at: Date
    updated_at: Date
}

@injectable()
export class AuthTokenRepository {
    constructor(@inject(Database) private database: Database) {}

    private run(trx?: QueryRunner) {
        return trx ?? this.database.pool
    }

    async insertLoginToken(
        write: { id: string; email: string; tokenHash: string; ip: string; minutes: number },
        trx?: QueryRunner
    ): Promise<LoginTokenRow> {
        const { rows } = await this.run(trx).query<LoginTokenRow>(INSERT_LOGIN_TOKEN, [
            write.id, write.email, write.tokenHash, write.ip, write.minutes,
        ])
        return rows[0]
    }

    async consumeLoginToken(tokenHash: string, trx?: QueryRunner): Promise<LoginTokenRow | undefined> {
        const { rows } = await this.run(trx).query<LoginTokenRow>(CONSUME_LOGIN_TOKEN, [tokenHash])
        return rows[0]
    }

    async purgeLoginTokens(trx?: QueryRunner): Promise<number> {
        const result = await this.run(trx).query(PURGE_LOGIN_TOKENS)
        return result.rowCount ?? 0
    }

    async insertApiKey(
        write: {
            id: string
            ownerId: string
            name: string
            prefix: string
            tokenHash: string
            scopes: string[]
            expiresAt: Date | null
        },
        trx?: QueryRunner
    ): Promise<ApiKeyRow> {
        const { rows } = await this.run(trx).query<ApiKeyRow>(INSERT_API_KEY, [
            write.id, write.ownerId, write.name, write.prefix, write.tokenHash,
            JSON.stringify(write.scopes), write.expiresAt,
        ])
        return rows[0]
    }

    async listApiKeys(ownerId: string, trx?: QueryRunner): Promise<ApiKeyRow[]> {
        const { rows } = await this.run(trx).query<ApiKeyRow>(SELECT_API_KEYS, [ownerId])
        return rows
    }

    async findApiKey(tokenHash: string, trx?: QueryRunner): Promise<ApiKeyRow | undefined> {
        const { rows } = await this.run(trx).query<ApiKeyRow>(FIND_API_KEY, [tokenHash])
        return rows[0]
    }

    async revokeApiKey(id: string, ownerId: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(REVOKE_API_KEY, [id, ownerId])
        return (result.rowCount ?? 0) > 0
    }

    async touchApiKey(id: string, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(TOUCH_API_KEY, [id])
    }
}
