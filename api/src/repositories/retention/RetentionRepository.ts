import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import { BaseRepository } from '@toolcase/node'
import { repositoryOptions } from '../../logging.js'

import COUNT_TABLE from './sql/count-table.sql'
import PURGE_TABLE from './sql/purge-table.sql'
import SELECT_TABLES from './sql/select-tables.sql'

const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]{0,62}$/

export type TableCounts = {
    total: number
    softDeleted: number
    due: number
}

@injectable()
export class RetentionRepository extends BaseRepository<unknown, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'retention', 'id', repositoryOptions)
    }

    private known = new Set<string>()

    async listTables(trx?: QueryRunner): Promise<string[]> {
        return this.time('listTables', async () => {
            const { rows } = await this.run(trx).query<{ table_name: string }>(SELECT_TABLES)
            const tables = rows.map((row) => row.table_name).filter((name) => SAFE_IDENTIFIER.test(name))
            this.known = new Set(tables)
            return tables
        })
    }

    private resolve(table: string): string {
        if (!SAFE_IDENTIFIER.test(table) || !this.known.has(table)) {
            throw new Error(`refusing to target unknown table "${table}"`)
        }
        return table
    }

    async counts(table: string, days: number, trx?: QueryRunner): Promise<TableCounts> {
        return this.time('counts', async () => {
            const sql = COUNT_TABLE.replaceAll('{{table}}', this.resolve(table))
            const { rows } = await this.run(trx).query<{ total: string; soft_deleted: string; due: string }>(sql, [
                Math.max(0, days),
                days > 0,
            ])
            const row = rows[0]
            return {
                total: Number(row?.total ?? 0),
                softDeleted: Number(row?.soft_deleted ?? 0),
                due: Number(row?.due ?? 0),
            }
        })
    }

    async purgeBatch(table: string, days: number, batchSize: number, trx?: QueryRunner): Promise<number> {
        return this.time('purgeBatch', async () => {
            const sql = PURGE_TABLE.replaceAll('{{table}}', this.resolve(table))
            const result = await this.run(trx).query(sql, [days, batchSize])
            return result.rowCount ?? 0
        })
    }
}
