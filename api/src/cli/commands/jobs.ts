import type { JobSchedule } from '../../contracts/index.js'
import { request } from '../client.js'
import { iso, table } from '../output.js'

export const jobsCommand = async (): Promise<void> => {
    const schedules = await request<JobSchedule[]>('/control/jobs')
    table(schedules.map((schedule) => ({
        kind: schedule.kind,
        cron: schedule.cron,
        next_run: iso(schedule.nextRunAt),
        last_status: schedule.lastRun?.status ?? '',
        last_run: iso(schedule.lastRun?.runAt ?? null),
        description: schedule.description,
    })))
}
