import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'
import { BaseRepository } from '@toolcase/node'
import { repositoryOptions } from '../../logging.js'

import COMPLETE_IDEMPOTENCY_KEY from './sql/complete-idempotency-key.sql'
import HIT_RATE_LIMIT from './sql/hit-rate-limit.sql'
import PURGE_RATE_LIMITS from './sql/purge-rate-limits.sql'
import RELEASE_IDEMPOTENCY_KEY from './sql/release-idempotency-key.sql'
import RESERVE_IDEMPOTENCY_KEY from './sql/reserve-idempotency-key.sql'
import SELECT_IDEMPOTENCY_KEY from './sql/select-idempotency-key.sql'

export type IdempotencyRow = {
    key: string
    user_id: string | null
    endpoint: string
    fingerprint: string
    status_code: number
    response: unknown
    created_at: Date
}

@injectable()
export class PlatformRepository extends BaseRepository<unknown, QueryRunner> {
    constructor(@inject(Database) database: Database) {
        super(database.pool, 'platform', 'id', repositoryOptions)
    }

    async hitRateLimit(
        bucket: string,
        windowSeconds: number,
        trx?: QueryRunner
    ): Promise<{ hits: number; windowStart: Date }> {
        return this.time('hitRateLimit', async () => {
            const { rows } = await this.run(trx).query<{ hits: number; window_start: Date }>(
                HIT_RATE_LIMIT,
                [bucket, windowSeconds]
            )
            return { hits: rows[0]?.hits ?? 1, windowStart: rows[0]?.window_start ?? new Date() }
        })
    }

    async purgeRateLimits(trx?: QueryRunner): Promise<number> {
        return this.time('purgeRateLimits', async () => {
            const result = await this.run(trx).query(PURGE_RATE_LIMITS)
            return result.rowCount ?? 0
        })
    }

    async findIdempotency(key: string, trx?: QueryRunner): Promise<IdempotencyRow | undefined> {
        return this.time('findIdempotency', async () => {
            const { rows } = await this.run(trx).query<IdempotencyRow>(SELECT_IDEMPOTENCY_KEY, [key])
            return rows[0]
        })
    }

    async reserveIdempotency(
        reservation: {
            key: string
            userId: string | null
            endpoint: string
            fingerprint: string
            staleAfterSeconds: number
        },
        trx?: QueryRunner
    ): Promise<boolean> {
        const result = await this.run(trx).query(RESERVE_IDEMPOTENCY_KEY, [
            reservation.key,
            reservation.userId,
            reservation.endpoint,
            reservation.fingerprint,
            reservation.staleAfterSeconds,
        ])
        return (result.rowCount ?? 0) > 0
    }

    async releaseIdempotency(key: string, trx?: QueryRunner): Promise<void> {
        return this.time('releaseIdempotency', async () => {
            await this.run(trx).query(RELEASE_IDEMPOTENCY_KEY, [key])
        })
    }

    async completeIdempotency(
        write: { key: string; statusCode: number; response: unknown },
        trx?: QueryRunner
    ): Promise<void> {
        return this.time('completeIdempotency', async () => {
            await this.run(trx).query(COMPLETE_IDEMPOTENCY_KEY, [
                write.key, write.statusCode, JSON.stringify(write.response ?? null),
            ])
        })
    }
}
