import { randomBytes, randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { User } from '../../contracts/index.js'
import { Database } from '../../Database.js'
import { toUser, type SessionRow, type UserRow } from '../../schema/users.js'

import DELETE_EXPIRED_SESSIONS from './sql/delete-expired-sessions.sql'
import DELETE_SESSION from './sql/delete-session.sql'
import DELETE_SESSION_FOR_USER from './sql/delete-session-for-user.sql'
import DELETE_USER_SESSIONS from './sql/delete-user-sessions.sql'
import FIND_SESSION_BY_PUBLIC_ID from './sql/find-session-by-public-id.sql'
import FIND_SESSION_USER from './sql/find-session-user.sql'
import INSERT_SESSION from './sql/insert-session.sql'
import SELECT_SESSIONS_BY_USER from './sql/select-sessions-by-user.sql'
import TOUCH_SESSION from './sql/touch-session.sql'

const SESSION_TTL_DAYS = 30

export type SessionContext = {
    userAgent: string
    ip: string
}

@injectable()
export class SessionRepository {
    constructor(@inject(Database) private database: Database) {}

    async create(userId: string, context: SessionContext): Promise<string> {
        const id = randomBytes(32).toString('hex')
        await this.database.pool.query(INSERT_SESSION, [
            id,
            randomUUID(),
            userId,
            context.userAgent,
            context.ip,
            SESSION_TTL_DAYS,
        ])
        return id
    }

    async findSessionUser(sessionId: string): Promise<User | null> {
        const { rows } = await this.database.pool.query<UserRow>(FIND_SESSION_USER, [sessionId])
        return rows[0] ? toUser(rows[0]) : null
    }

    async listForUser(userId: string): Promise<SessionRow[]> {
        const { rows } = await this.database.pool.query<SessionRow>(SELECT_SESSIONS_BY_USER, [userId])
        return rows
    }

    async findForUser(userId: string, publicId: string): Promise<SessionRow | undefined> {
        const { rows } = await this.database.pool.query<SessionRow>(FIND_SESSION_BY_PUBLIC_ID, [userId, publicId])
        return rows[0]
    }

    async touch(sessionId: string): Promise<void> {
        await this.database.pool.query(TOUCH_SESSION, [sessionId])
    }

    async delete(sessionId: string): Promise<void> {
        await this.database.pool.query(DELETE_SESSION, [sessionId])
    }

    async deleteForUser(userId: string): Promise<void> {
        await this.database.pool.query(DELETE_USER_SESSIONS, [userId])
    }

    async deletePublicForUser(userId: string, publicId: string): Promise<boolean> {
        const result = await this.database.pool.query(DELETE_SESSION_FOR_USER, [userId, publicId])
        return (result.rowCount ?? 0) > 0
    }

    async deleteExpired(): Promise<number> {
        const result = await this.database.pool.query(DELETE_EXPIRED_SESSIONS)
        return result.rowCount ?? 0
    }
}
