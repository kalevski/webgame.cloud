import { inject, injectable } from 'tsyringe'
import { Database } from '../../Database.js'
import { SessionRepository } from '../users/SessionRepository.js'

import DELETE_USER from './sql/delete-user.sql'
import UPDATE_NAME from './sql/update-name.sql'

@injectable()
export class AccountRepository {
    constructor(
        @inject(Database) private database: Database,
        @inject(SessionRepository) private sessions: SessionRepository
    ) {}

    async updateName(userId: string, name: string): Promise<boolean> {
        const result = await this.database.pool.query(UPDATE_NAME, [userId, name])
        this.sessions.invalidateUsers()
        return (result.rowCount ?? 0) > 0
    }

    async deleteUser(userId: string): Promise<boolean> {
        const { rows } = await this.database.pool.query<{ c: number }>(DELETE_USER, [userId])
        this.sessions.invalidateUsers()
        return (rows[0]?.c ?? 0) > 0
    }
}
