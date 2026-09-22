import type { ControlRunResult } from '../../contracts/index.js'
import { request } from '../client.js'
import { out } from '../output.js'

export const runCommand = async (kinds: string[]): Promise<void> => {
    const result = await request<ControlRunResult>('/control/jobs/run', {
        method: 'POST',
        body: { kinds },
    })
    out(`enqueued: ${result.triggered.join(', ')}`)
}
