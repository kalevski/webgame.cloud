import { randomUUID } from 'node:crypto'
import { inject, injectable } from 'tsyringe'
import type { AppType } from '../../contracts/index.js'
import { Database, type QueryRunner } from '../../Database.js'
import { repositoryOptions } from '../../logging.js'
import { BaseRepository } from '@toolcase/node'
import type { NamedProjectRow, ProjectRow } from '../../schema/projects.js'

import SELECT_PROJECTS_FOR_USER from './sql/select-projects-for-user.sql'
import SELECT_PROJECT from './sql/select-project.sql'
import SELECT_PROJECT_FOR_USER from './sql/select-project-for-user.sql'
import INSERT_PROJECT from './sql/insert-project.sql'
import UPDATE_PROJECT from './sql/update-project.sql'
import UPDATE_PROJECT_ARCHIVED from './sql/update-project-archived.sql'
import UPDATE_PROJECT_OWNER from './sql/update-project-owner.sql'
import UPDATE_PROJECT_REALM from './sql/update-project-realm.sql'
import SELECT_PROJECT_STORAGE_PATHS from './sql/select-project-storage-paths.sql'
import DELETE_PROJECT from './sql/delete-project.sql'
import COUNT_OWNED_PROJECTS from './sql/count-owned-projects.sql'
import SUM_PROJECT_BYTES from './sql/sum-project-bytes.sql'

import SELECT_CATEGORIES from './sql/select-categories.sql'
import SELECT_TAGS from './sql/select-tags.sql'
import SELECT_BUILD_TAGS from './sql/select-build-tags.sql'
import INSERT_CATEGORIES from './sql/insert-categories.sql'
import INSERT_TAGS from './sql/insert-tags.sql'
import INSERT_BUILD_TAGS from './sql/insert-build-tags.sql'
import DELETE_CATEGORIES_MISSING from './sql/delete-categories-missing.sql'
import DELETE_TAGS_MISSING from './sql/delete-tags-missing.sql'
import DELETE_BUILD_TAGS_MISSING from './sql/delete-build-tags-missing.sql'
import COUNT_TAG_USAGE from './sql/count-tag-usage.sql'
import COUNT_BUILD_TAG_USAGE from './sql/count-build-tag-usage.sql'
import COUNT_CATEGORY_USAGE from './sql/count-category-usage.sql'

export type ProjectWrite = {
    ownerId: string
    realmId: string | null
    name: string
    description: string
    appType: AppType
    icon: string
    color: string
}

export type VocabularyKind = 'categories' | 'tags' | 'buildTags'

const SELECT_BY_KIND: Record<VocabularyKind, string> = {
    categories: SELECT_CATEGORIES,
    tags: SELECT_TAGS,
    buildTags: SELECT_BUILD_TAGS,
}

const INSERT_BY_KIND: Record<VocabularyKind, string> = {
    categories: INSERT_CATEGORIES,
    tags: INSERT_TAGS,
    buildTags: INSERT_BUILD_TAGS,
}

const DELETE_BY_KIND: Record<VocabularyKind, string> = {
    categories: DELETE_CATEGORIES_MISSING,
    tags: DELETE_TAGS_MISSING,
    buildTags: DELETE_BUILD_TAGS_MISSING,
}

@injectable()
export class ProjectRepository extends BaseRepository<ProjectRow, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'projects', 'id', repositoryOptions)
    }

    async listForUser(userId: string, archived: boolean, trx?: QueryRunner): Promise<ProjectRow[]> {
        return this.time('listForUser', async () => {
            const { rows } = await this.run(trx).query<ProjectRow>(SELECT_PROJECTS_FOR_USER, [userId, archived])
            return rows
        })
    }

    async findById(id: string, trx?: QueryRunner): Promise<ProjectRow | undefined> {
        return this.time('findById', async () => {
            const { rows } = await this.run(trx).query<ProjectRow>(SELECT_PROJECT, [id])
            return rows[0]
        })
    }

    async findByIdForUser(id: string, userId: string, trx?: QueryRunner): Promise<ProjectRow | undefined> {
        return this.time('findByIdForUser', async () => {
            const { rows } = await this.run(trx).query<ProjectRow>(SELECT_PROJECT_FOR_USER, [id, userId])
            return rows[0]
        })
    }

    async create(write: ProjectWrite, trx?: QueryRunner): Promise<ProjectRow> {
        return this.time('create', async () => {
            const { rows } = await this.run(trx).query<{ id: string }>(INSERT_PROJECT, [
                randomUUID(),
                write.ownerId,
                write.realmId,
                write.name,
                write.description,
                write.appType,
                write.icon,
                write.color,
            ])
            const created = await this.findById(rows[0].id, trx)
            return created!
        })
    }

    async updateFields(
        id: string,
        patch: {
            name: string
            description: string
            appType: AppType
            icon: string
            color: string
            defaultCategoryId: string
        },
        trx?: QueryRunner
    ): Promise<ProjectRow | undefined> {
        return this.time('updateFields', async () => {
            const result = await this.run(trx).query(UPDATE_PROJECT, [
                id,
                patch.name,
                patch.description,
                patch.appType,
                patch.icon,
                patch.color,
                patch.defaultCategoryId,
            ])
            if ((result.rowCount ?? 0) === 0) return undefined
            return this.findById(id, trx)
        })
    }

    async setArchived(id: string, archived: boolean, trx?: QueryRunner): Promise<boolean> {
        return this.time('setArchived', async () => {
            const result = await this.run(trx).query(UPDATE_PROJECT_ARCHIVED, [id, archived])
            return (result.rowCount ?? 0) > 0
        })
    }

    async setOwner(id: string, ownerId: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('setOwner', async () => {
            const result = await this.run(trx).query(UPDATE_PROJECT_OWNER, [id, ownerId])
            return (result.rowCount ?? 0) > 0
        })
    }

    async setRealm(id: string, realmId: string | null, trx?: QueryRunner): Promise<boolean> {
        return this.time('setRealm', async () => {
            const result = await this.run(trx).query(UPDATE_PROJECT_REALM, [id, realmId])
            return (result.rowCount ?? 0) > 0
        })
    }

    async storagePaths(id: string, trx?: QueryRunner): Promise<string[]> {
        return this.time('storagePaths', async () => {
            const { rows } = await this.run(trx).query<{ storage_path: string }>(SELECT_PROJECT_STORAGE_PATHS, [id])
            return rows.map((row) => row.storage_path)
        })
    }

    async softDeleteCascade(id: string, trx?: QueryRunner): Promise<boolean> {
        return this.time('softDeleteCascade', async () => {
            const { rows } = await this.run(trx).query<{ c: number }>(DELETE_PROJECT, [id])
            return (rows[0]?.c ?? 0) > 0
        })
    }

    async sumBytes(projectId: string, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: string }>(SUM_PROJECT_BYTES, [projectId])
        return Number(rows[0]?.c ?? 0)
    }

    async countOwned(userId: string, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: string }>(COUNT_OWNED_PROJECTS, [userId])
        return Number(rows[0]?.c ?? 0)
    }

    async listVocabulary(kind: VocabularyKind, projectId: string, trx?: QueryRunner): Promise<NamedProjectRow[]> {
        const { rows } = await this.run(trx).query<NamedProjectRow>(SELECT_BY_KIND[kind], [projectId])
        return rows
    }

    async insertVocabulary(
        kind: VocabularyKind,
        projectId: string,
        name: string,
        trx?: QueryRunner
    ): Promise<string> {
        const { rows } = await this.run(trx).query<{ id: string }>(INSERT_BY_KIND[kind], [
            randomUUID(),
            projectId,
            name,
        ])
        return rows[0].id
    }

    async pruneVocabulary(
        kind: VocabularyKind,
        projectId: string,
        keep: string[],
        trx?: QueryRunner
    ): Promise<Array<{ id: string; name: string }>> {
        const { rows } = await this.run(trx).query<{ id: string; name: string }>(DELETE_BY_KIND[kind], [
            projectId,
            keep.map((name) => name.toLowerCase()),
        ])
        return rows
    }

    async countTagUsage(projectId: string, name: string, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: string }>(COUNT_TAG_USAGE, [projectId, name])
        return Number(rows[0]?.c ?? 0)
    }

    async countBuildTagUsage(projectId: string, name: string, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: string }>(COUNT_BUILD_TAG_USAGE, [projectId, name])
        return Number(rows[0]?.c ?? 0)
    }

    async countCategoryUsage(projectId: string, categoryId: string, trx?: QueryRunner): Promise<number> {
        const { rows } = await this.run(trx).query<{ c: string }>(COUNT_CATEGORY_USAGE, [projectId, categoryId])
        return Number(rows[0]?.c ?? 0)
    }
}
