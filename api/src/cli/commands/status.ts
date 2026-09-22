import type { ControlStatus } from '../../contracts/index.js'
import { request } from '../client.js'
import { iso, out, table } from '../output.js'

export const statusCommand = async (): Promise<void> => {
    const status = await request<ControlStatus>('/control/status')

    out(`${status.name} ${status.version} (build ${status.build})`)
    out(`started at: ${iso(status.startedAt)}`)
    out(`ready: ${status.ready ? 'yes' : 'no'}`)
    out('')
    out('components')
    table(status.components.map((component) => ({
        component: component.key,
        state: component.state,
        detail: component.detail,
    })))
    out('')

    const firing = status.alarms.filter((alarm) => alarm.firing)
    out(`alarms firing: ${firing.length}`)
    for (const alarm of firing) {
        out(`  ${alarm.key}: ${alarm.sentence}`)
        if (alarm.detail) out(`    ${alarm.detail}`)
    }
    out('')

    out('in-process workers')
    table(status.workers.map((worker) => ({
        name: worker.name,
        last_tick: iso(worker.lastTickAt),
        healthy: worker.healthy,
    })))
}
