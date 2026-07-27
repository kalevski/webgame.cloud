import { inject, injectable } from 'tsyringe'
import { Database, type QueryRunner } from '../../Database.js'

import HIT_RATE_LIMIT from './sql/hit-rate-limit.sql'
import INSERT_IDEMPOTENCY_KEY from './sql/insert-idempotency-key.sql'
import PURGE_RATE_LIMITS from './sql/purge-rate-limits.sql'
import SELECT_IDEMPOTENCY_KEY from './sql/select-idempotency-key.sql'

export type IdempotencyRow = {
    key: string
    user_id: string | null
    endpoint: string
    status_code: number
    response: unknown
    created_at: Date
}

@injectable()
export class PlatformRepository {
    constructor(@inject(Database) private database: Database) {}

    private run(trx?: QueryRunner) {
        return trx ?? this.database.pool
    }

    async hitRateLimit(
        bucket: string,
        windowSeconds: number,
        trx?: QueryRunner
    ): Promise<{ hits: number; windowStart: Date }> {
        const { rows } = await this.run(trx).query<{ hits: number; window_start: Date }>(
            HIT_RATE_LIMIT,
            [bucket, windowSeconds]
        )
        return { hits: rows[0]?.hits ?? 1, windowStart: rows[0]?.window_start ?? new Date() }
    }

    async purgeRateLimits(trx?: QueryRunner): Promise<number> {
        const result = await this.run(trx).query(PURGE_RATE_LIMITS)
        return result.rowCount ?? 0
    }

    async findIdempotency(key: string, trx?: QueryRunner): Promise<IdempotencyRow | undefined> {
        const { rows } = await this.run(trx).query<IdempotencyRow>(SELECT_IDEMPOTENCY_KEY, [key])
        return rows[0]
    }

    async saveIdempotency(
        write: { key: string; userId: string | null; endpoint: string; statusCode: number; response: unknown },
        trx?: QueryRunner
    ): Promise<void> {
        await this.run(trx).query(INSERT_IDEMPOTENCY_KEY, [
            write.key, write.userId, write.endpoint, write.statusCode, JSON.stringify(write.response ?? null),
        ])
    }
}
