import pg from 'pg'
import type { PoolClient } from 'pg'
import { injectable } from 'tsyringe'
import { DATABASE } from './env.js'
import { getLogger } from './logging.js'

const log = getLogger('database')

export type QueryRunner = pg.Pool | PoolClient

@injectable()
export class Database {
    public pool: pg.Pool = new pg.Pool(DATABASE)

    private listener: PoolClient | null = null

    private channels = new Map<string, Array<(payload: string) => void>>()

    private retryTimer: NodeJS.Timeout | null = null

    private closing = false

    private static readonly LISTENER_RETRY_MS = 5_000

    async init(): Promise<void> {
        this.pool.on('error', (error) => log.error('idle client error', error))
        await this.pool.query('SELECT 1')
    }

    async dispose(): Promise<void> {
        this.closing = true
        if (this.retryTimer) clearTimeout(this.retryTimer)
        this.retryTimer = null
        this.dropListener()
        await this.pool?.end()
    }

    async listen(channel: string, handler: (payload: string) => void): Promise<void> {
        const listeners = this.channels.get(channel) ?? []
        this.channels.set(channel, [...listeners, handler])
        await this.openListener()
    }

    private async openListener(): Promise<void> {
        if (this.listener || this.closing) return

        try {
            const client = await this.pool.connect()
            client.on('notification', (message) => {
                for (const listener of this.channels.get(message.channel) ?? []) {
                    listener(message.payload ?? '')
                }
            })
            client.on('error', (error) => {
                log.error('listener connection lost', error)
                this.dropListener()
                this.scheduleListenerRetry()
            })

            for (const channel of this.channels.keys()) {
                await client.query(`LISTEN ${channel}`)
            }
            this.listener = client
        } catch (error) {
            log.error('listener connect failed', error)
            this.scheduleListenerRetry()
        }
    }

    private dropListener(): void {
        if (!this.listener) return
        const client = this.listener
        this.listener = null
        try {
            client.release(true)
        } catch {
        }
    }

    private scheduleListenerRetry(): void {
        if (this.retryTimer || this.closing) return
        this.retryTimer = setTimeout(() => {
            this.retryTimer = null
            void this.openListener()
        }, Database.LISTENER_RETRY_MS)
        this.retryTimer.unref()
    }

    async notify(channel: string, payload = ''): Promise<void> {
        await this.pool.query('SELECT pg_notify($1, $2)', [channel, payload])
    }

    async transaction<T>(fn: (trx: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.pool.connect()
        try {
            await client.query('BEGIN')
            const result = await fn(client)
            await client.query('COMMIT')
            return result
        } catch (error) {
            await client.query('ROLLBACK')
            throw error
        } finally {
            client.release()
        }
    }
}
