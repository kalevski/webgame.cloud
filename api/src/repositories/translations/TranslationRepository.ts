import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { BaseRepository } from '@toolcase/node'
import type { TranslationDoc } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import type { TranslationRow } from '../../schema/translations.js'

import SELECT_TRANSLATIONS from './sql/select-translations.sql'
import UPSERT_TRANSLATIONS from './sql/upsert-translations.sql'

@injectable()
export class TranslationRepository extends BaseRepository<TranslationRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'project_translations', 'id', repositoryOptions)
    }

    async findByProject(projectId: string, trx?: QueryRunner): Promise<TranslationRow | undefined> {
        return this.time('findByProject', async () => {
            const { rows } = await this.run(trx).query<TranslationRow>(SELECT_TRANSLATIONS, [projectId])
            return rows[0]
        })
    }

    async saveDoc(projectId: string, doc: TranslationDoc, trx?: QueryRunner): Promise<TranslationRow | undefined> {
        return this.time('saveDoc', async () => {
            await this.run(trx).query(UPSERT_TRANSLATIONS, [randomUUID(), projectId, JSON.stringify(doc)])
            return this.findByProject(projectId, trx)
        })
    }
}
