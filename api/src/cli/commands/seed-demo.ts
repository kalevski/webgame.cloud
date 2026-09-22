import type { DemoRequest, DemoResult, DemoScale } from '../../contracts/index.js'
import { DEMO_SCALES } from '../../contracts/index.js'
import { request } from '../client.js'
import { out, table } from '../output.js'

const isScale = (value: string): value is DemoScale => (DEMO_SCALES as readonly string[]).includes(value)

export const seedDemoCommand = async (options: Record<string, string>): Promise<void> => {
    const body: DemoRequest = {}

    if (options.scale) {
        if (!isScale(options.scale)) {
            throw new Error(`unknown scale "${options.scale}" — one of ${DEMO_SCALES.join(', ')}`)
        }
        body.scale = options.scale
    }
    if (options.seed) body.seed = options.seed
    if (options.force === 'true') body.force = true

    const result = await request<DemoResult>('/control/seed-demo', { method: 'POST', body })

    out(`seeded the ${result.scale} dataset with seed "${result.seed}" in ${result.tookMs} ms`)
    out('')
    table(Object.entries(result.created).map(([what, count]) => ({ what, count })))
    out('')
    out(`dispatches suppressed during the run: ${result.suppressedDispatches}`)
    out('')
    out('accounts (dev login takes any of these)')
    for (const account of result.accounts) out(`  ${account}`)
}
