import { inject, injectable } from 'tsyringe'
import { Database } from '../../Database.js'

import DELETE_USER from './sql/delete-user.sql'
import UPDATE_NAME from './sql/update-name.sql'

@injectable()
export class AccountRepository {
    constructor(@inject(Database) private database: Database) {}

    async updateName(userId: string, name: string): Promise<boolean> {
        const result = await this.database.pool.query(UPDATE_NAME, [userId, name])
        return (result.rowCount ?? 0) > 0
    }

    async deleteUser(userId: string): Promise<boolean> {
        const { rows } = await this.database.pool.query<{ c: number }>(DELETE_USER, [userId])
        return (rows[0]?.c ?? 0) > 0
    }
}
