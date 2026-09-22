import { randomBytes, randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { User } from '../../contracts/index.js'
import { Database } from '../../Database.js'
import { KeyedCache, Throttle } from '../../domain/cache.js'
import { toUser, type SessionRow, type UserRow } from '../../schema/users.js'

import DELETE_EXPIRED_SESSIONS from './sql/delete-expired-sessions.sql'
import DELETE_SESSION from './sql/delete-session.sql'
import DELETE_SESSION_FOR_USER from './sql/delete-session-for-user.sql'
import DELETE_USER_SESSIONS from './sql/delete-user-sessions.sql'
import FIND_SESSION_FOR_USER from './sql/find-session-for-user.sql'
import FIND_SESSION_USER from './sql/find-session-user.sql'
import INSERT_SESSION from './sql/insert-session.sql'
import SELECT_SESSIONS_BY_USER from './sql/select-sessions-by-user.sql'
import TOUCH_SESSION from './sql/touch-session.sql'
import { hashSecret } from '../../domain/secrets.js'

const SESSION_TTL_DAYS = 30

export const SESSION_CHANNEL = 'session_invalidated'

const SESSION_CACHE_MS = 5_000
const SESSION_CACHE_MAX = 5_000
const TOUCH_INTERVAL_MS = 5 * 60 * 1000

export type SessionContext = {
    userAgent: string
    ip: string
}

export type SessionUser = {
    user: User

    impersonatedBy: string | null
}

export const hashSessionToken = (token: string): string =>
    hashSecret(token)

@injectable()
export class SessionRepository {
    private sessions = new KeyedCache<SessionUser | null>(SESSION_CACHE_MS, SESSION_CACHE_MAX)

    private touches = new Throttle(TOUCH_INTERVAL_MS)

    constructor(@inject(Database) private database: Database) {}

    async init(): Promise<void> {
        await this.database.listen(SESSION_CHANNEL, (payload) => {
            if (payload === '*') this.sessions.clear()
            else this.sessions.drop(payload)
        })
    }

    private invalidate(hash?: string): void {
        if (hash) this.sessions.drop(hash)
        else this.sessions.clear()
        void this.database.notify(SESSION_CHANNEL, hash ?? '*').catch(() => undefined)
    }

    invalidateUsers(): void {
        this.invalidate()
    }

    async create(userId: string, context: SessionContext, impersonatedBy: string | null = null): Promise<string> {
        const token = randomBytes(32).toString('hex')
        await this.database.pool.query(INSERT_SESSION, [
            randomUUID(),
            hashSessionToken(token),
            userId,
            context.userAgent,
            context.ip,
            SESSION_TTL_DAYS,
            impersonatedBy,
        ])
        return token
    }

    async findSessionUser(token: string): Promise<SessionUser | null> {
        const hash = hashSessionToken(token)
        return this.sessions.get(hash, async () => {
            const { rows } = await this.database.pool
                .query<UserRow & { impersonated_by: string | null }>(FIND_SESSION_USER, [hash])
            const row = rows[0]
            return row ? { user: toUser(row), impersonatedBy: row.impersonated_by } : null
        })
    }

    async listForUser(userId: string): Promise<SessionRow[]> {
        const { rows } = await this.database.pool.query<SessionRow>(SELECT_SESSIONS_BY_USER, [userId])
        return rows
    }

    async findForUser(userId: string, sessionId: string): Promise<SessionRow | undefined> {
        const { rows } = await this.database.pool.query<SessionRow>(FIND_SESSION_FOR_USER, [userId, sessionId])
        return rows[0]
    }

    async touch(token: string): Promise<void> {
        const hash = hashSessionToken(token)
        if (!this.touches.due(hash)) return
        await this.database.pool.query(TOUCH_SESSION, [hash])
    }

    async delete(token: string): Promise<void> {
        const hash = hashSessionToken(token)
        await this.database.pool.query(DELETE_SESSION, [hash])
        this.invalidate(hash)
    }

    async deleteForUser(userId: string): Promise<void> {
        await this.database.pool.query(DELETE_USER_SESSIONS, [userId])
        this.invalidate()
    }

    async deleteOneForUser(userId: string, sessionId: string): Promise<boolean> {
        const result = await this.database.pool.query(DELETE_SESSION_FOR_USER, [userId, sessionId])
        const deleted = (result.rowCount ?? 0) > 0
        if (deleted) this.invalidate()
        return deleted
    }

    async deleteExpired(): Promise<number> {
        const result = await this.database.pool.query(DELETE_EXPIRED_SESSIONS)
        const deleted = result.rowCount ?? 0
        if (deleted > 0) this.invalidate()
        return deleted
    }
}
