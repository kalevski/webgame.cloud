import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'

import SELECT_SETTING from './sql/select-setting.sql'
import SELECT_SETTINGS_BY_PREFIX from './sql/select-settings-by-prefix.sql'
import UPSERT_SETTING from './sql/upsert-setting.sql'
import INSERT_SETTING_IF_ABSENT from './sql/insert-setting-if-absent.sql'

@injectable()
export class SettingsRepository {
    constructor(@inject(Database) private database: Database) {}

    private run(trx?: QueryRunner): QueryRunner {
        return trx ?? this.database.pool
    }

    async get(key: string, trx?: QueryRunner): Promise<string | undefined> {
        const { rows } = await this.run(trx).query<{ value: string }>(SELECT_SETTING, [key])
        return rows[0]?.value
    }

    async getByPrefix(prefix: string, trx?: QueryRunner): Promise<Map<string, string>> {
        const { rows } = await this.run(trx).query<{ key: string; value: string }>(SELECT_SETTINGS_BY_PREFIX, [prefix])
        return new Map(rows.map((row) => [row.key, row.value]))
    }

    async set(key: string, value: string, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(UPSERT_SETTING, [key, value])
    }

    async setIfAbsent(key: string, value: string, trx?: QueryRunner): Promise<void> {
        await this.run(trx).query(INSERT_SETTING_IF_ABSENT, [key, value])
    }
}
