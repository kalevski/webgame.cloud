import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import { BaseRepository } from '@toolcase/node'
import { repositoryOptions } from '../../logging.js'

import SELECT_SETTING from './sql/select-setting.sql'
import SELECT_SETTINGS_BY_KEYS from './sql/select-settings-by-keys.sql'
import SELECT_SETTINGS_BY_PREFIX from './sql/select-settings-by-prefix.sql'
import UPSERT_SETTING from './sql/upsert-setting.sql'
import INSERT_SETTING_IF_ABSENT from './sql/insert-setting-if-absent.sql'

@injectable()
export class SettingsRepository extends BaseRepository<unknown, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'settings', 'id', repositoryOptions)
    }

    async get(key: string, trx?: QueryRunner): Promise<string | undefined> {
        return this.time('get', async () => {
            const { rows } = await this.run(trx).query<{ value: string }>(SELECT_SETTING, [key])
            return rows[0]?.value
        })
    }

    async getMany(keys: readonly string[], trx?: QueryRunner): Promise<Map<string, string>> {
        return this.time('getMany', async () => {
            if (keys.length === 0) return new Map()
            const { rows } = await this.run(trx).query<{ key: string; value: string }>(
                SELECT_SETTINGS_BY_KEYS,
                [[...keys]]
            )
            return new Map(rows.map((row) => [row.key, row.value]))
        })
    }

    async getByPrefix(prefix: string, trx?: QueryRunner): Promise<Map<string, string>> {
        return this.time('getByPrefix', async () => {
            const { rows } = await this.run(trx).query<{ key: string; value: string }>(SELECT_SETTINGS_BY_PREFIX, [prefix])
            return new Map(rows.map((row) => [row.key, row.value]))
        })
    }

    async set(key: string, value: string, trx?: QueryRunner): Promise<void> {
        return this.time('set', async () => {
            await this.run(trx).query(UPSERT_SETTING, [key, value])
        })
    }

    async setIfAbsent(key: string, value: string, trx?: QueryRunner): Promise<void> {
        return this.time('setIfAbsent', async () => {
            await this.run(trx).query(INSERT_SETTING_IF_ABSENT, [key, value])
        })
    }
}
