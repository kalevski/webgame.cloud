import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import { BaseRepository } from '@toolcase/node'
import type { BuildFileDraft, BuildSnapshot } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import type { BuildFileRow, BuildRow, BuildRowStatus } from '../../schema/builds.js'

import SELECT_BUILDS from './sql/select-builds.sql'
import SELECT_BUILD from './sql/select-build.sql'
import SELECT_BUILD_FILES from './sql/select-build-files.sql'
import INSERT_BUILD from './sql/insert-build.sql'
import CLAIM_BUILD from './sql/claim-build.sql'
import UPDATE_STATUS from './sql/update-status.sql'
import COMPLETE_BUILD from './sql/complete-build.sql'
import CLEAR_BUILD_FILES from './sql/clear-build-files.sql'
import INSERT_BUILD_FILE from './sql/insert-build-file.sql'
import CLEAR_SIBLING_TAG from './sql/clear-sibling-tag.sql'
import SET_BUILD_TAG from './sql/set-build-tag.sql'
import DELETE_BUILD from './sql/delete-build.sql'
import PURGE_UNTAGGED from './sql/purge-untagged.sql'
import REAP_STALE from './sql/reap-stale.sql'
import SELECT_MANIFEST from './sql/select-manifest.sql'

export type BuildQuery = {
    status?: BuildRowStatus
    bundleId?: string
    limit?: number
    offset?: number
    cursorCreatedAt?: string
    cursorId?: string
}

export type ManifestRow = {
    id: string
    build_tag: string
    checksum: string
    files: Array<{ group: string; name: string; url: string; sizeBytes: number; checksum: string }>
}

@injectable()
export class BuildRepository extends BaseRepository<BuildRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'builds', 'id', repositoryOptions)
    }

    async listByProject(projectId: string, query: BuildQuery = {}, trx?: QueryRunner): Promise<BuildRow[]> {
        return this.time('listByProject', async () => {
            const { rows } = await this.run(trx).query<BuildRow>(SELECT_BUILDS, [
                projectId,
                query.status ?? null,
                query.bundleId ?? null,
                query.cursorCreatedAt ?? null,
                query.cursorId ?? null,
                Math.min(200, query.limit ?? 50),
                query.cursorCreatedAt ? 0 : query.offset ?? 0,
            ])
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<BuildRow | undefined> {
        const { rows } = await this.run(trx).query<BuildRow>(SELECT_BUILD, [id])
        return rows[0]
    }

    async listFiles(buildId: string, trx?: QueryRunner): Promise<BuildFileRow[]> {
        const { rows } = await this.run(trx).query<BuildFileRow>(SELECT_BUILD_FILES, [buildId])
        return rows
    }

    async create(
        write: {
            projectId: string
            bundleId: string
            realmId: string | null
            triggeredBy: string
            buildTag: string
            snapshot: BuildSnapshot
        },
        trx?: QueryRunner
    ): Promise<BuildRow> {
        return this.time('create', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_BUILD, [
                randomUUID(),
                write.projectId,
                write.bundleId,
                write.realmId,
                write.triggeredBy,
                write.buildTag,
                JSON.stringify(write.snapshot),
            ])
            const created = await this.findById(rows[0].id, trx)
            return created!
        })
    }

    async claim(realmId: string, trx?: QueryRunner): Promise<BuildRow | undefined> {
        const { rows } = await this.run(trx).query<BuildRow>(CLAIM_BUILD, [realmId])
        return rows[0]
    }

    async markRunning(buildId: string, realmId: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(UPDATE_STATUS, [buildId, realmId])
        return (result.rowCount ?? 0) > 0
    }

    async complete(
        buildId: string,
        realmId: string,
        write: {
            status: 'done' | 'failed'
            artifactUrl: string
            manifestUrl: string
            checksum: string
            sizeBytes: number
            durationMs: number
            error: string
            files: BuildFileDraft[]
        },
        trx?: QueryRunner
    ): Promise<boolean> {
        const runner = this.run(trx)
        const result = await runner.query(COMPLETE_BUILD, [
            buildId,
            realmId,
            write.status,
            write.artifactUrl,
            write.manifestUrl,
            write.checksum,
            Math.max(0, Math.floor(write.sizeBytes)),
            Math.max(0, Math.floor(write.durationMs)),
            write.error,
        ])
        if ((result.rowCount ?? 0) === 0) return false

        await runner.query(CLEAR_BUILD_FILES, [buildId])
        for (const file of write.files) {
            await runner.query(INSERT_BUILD_FILE, [
                randomUUID(),
                buildId,
                file.group,
                file.name,
                file.url ?? '',
                Math.max(0, Math.floor(file.sizeBytes ?? 0)),
                file.checksum ?? '',
            ])
        }
        return true
    }

    async setTag(build: BuildRow, tag: string, trx?: QueryRunner): Promise<void> {
        const runner = this.run(trx)
        if (tag) await runner.query(CLEAR_SIBLING_TAG, [build.bundle_id, tag, build.id])
        await runner.query(SET_BUILD_TAG, [build.id, tag])
    }

    async softDelete(id: string, projectId: string, trx?: QueryRunner): Promise<boolean> {
        const result = await this.run(trx).query(DELETE_BUILD, [id, projectId])
        return (result.rowCount ?? 0) > 0
    }

    async purgeUntagged(projectId: string, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: number }>(PURGE_UNTAGGED, [projectId])
        return rows[0]?.c ?? 0
    }

    async reapStale(minutes: number, trx?: QueryRunner): Promise<Array<{ id: string; project_id: string }>> {
        const { rows } = await this.run(trx).query<{ id: string; project_id: string }>(REAP_STALE, [minutes])
        return rows
    }

    async manifest(
        projectId: string,
        buildId: string | null,
        buildTag: string,
        trx?: QueryRunner
    ): Promise<ManifestRow | undefined> {
        const { rows } = await this.run(trx).query<ManifestRow>(SELECT_MANIFEST, [projectId, buildId, buildTag])
        return rows[0]
    }
}
