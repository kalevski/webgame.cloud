import React, { useEffect } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import Loading from 'components/Loading'
import ModuleActions from 'components/ModuleActions'
import { useTc } from '@toolcase/web-components/react'
import { escapeHtml } from 'helpers/html'
import { Job, JobSchedule, JobStatus } from 'types'
import { formatDateTime } from 'helpers/dates'

const STATUS_VARIANTS: Record<JobStatus, string> = {
    queued: 'secondary',
    running: 'info',
    done: 'success',
    failed: 'danger',
    canceled: 'warning',
}

const RUNS_LIMIT = 10

const formatWhen = (value: string | null): string =>
    value ? formatDateTime(value) : ''

const JobsAdmin: React.FC = () => {
    const { t } = useStrings()
    const j = t.jobs

    const jobSchedules = useStore((state) => state.jobSchedules)
    const jobSchedulesLoaded = useStore((state) => state.jobSchedulesLoaded)
    const jobs = useStore((state) => state.jobs)
    const jobStats = useStore((state) => state.jobStats)
    const jobsLoading = useStore((state) => state.jobsLoading)
    const jobsNextCursor = useStore((state) => state.jobsNextCursor)
    const fetchJobSchedules = useStore((state) => state.fetchJobSchedules)
    const fetchJobs = useStore((state) => state.fetchJobs)
    const fetchMoreJobs = useStore((state) => state.fetchMoreJobs)
    const runJobs = useStore((state) => state.runJobs)

    const canWrite = useCan('job.write')

    useEffect(() => {
        void fetchJobSchedules()
        void fetchJobs({ limit: RUNS_LIMIT, offset: 0 })
    }, [fetchJobSchedules, fetchJobs])

    const scheduleRow = (schedule: JobSchedule): string => {
        const last = schedule.lastRun
        const status = last
            ? `<tc-badge variant="${STATUS_VARIANTS[last.status]}">${escapeHtml(j.statusLabels[last.status] ?? last.status)}</tc-badge>`
            : `<span class="module-jobs__muted">${escapeHtml(j.neverRan)}</span>`

        return (
            `<li class="tc-data-list__row" data-id="${escapeHtml(schedule.kind)}">` +
            `<div class="tc-data-list__text">` +
            `<span class="tc-data-list__primary">${escapeHtml(schedule.kind)}` +
            `<code class="module-jobs__cron">${escapeHtml(schedule.cron)}</code></span>` +
            `<span class="tc-data-list__secondary">${escapeHtml(schedule.description)}</span>` +
            `</div>` +
            `<span class="module-jobs__meta">` +
            `<span class="module-jobs__next">${escapeHtml(j.colNext)}: ${escapeHtml(formatWhen(schedule.nextRunAt))}</span>` +
            status +
            `</span>` +
            (canWrite
                ? `<span class="table-actions">` +
                  `<tc-button variant="secondary" size="sm" outline data-action="run">${escapeHtml(j.runOne)}</tc-button>` +
                  `</span>`
                : '') +
            `</li>`
        )
    }

    const scheduleList = useTc<HTMLElement>({
        items: jobSchedules,
        renderRow: scheduleRow,
        onAction: (detail: { action: string; id: string }) => {
            if (detail.action === 'run') void runJobs([detail.id])
        },
    })

    const runRow = (job: Job): string =>
        `<li class="tc-data-list__row" data-id="${escapeHtml(job.id)}">` +
        `<div class="tc-data-list__text">` +
        `<span class="tc-data-list__primary">${escapeHtml(job.kind)}</span>` +
        `<span class="tc-data-list__secondary">${escapeHtml(
            job.error || formatWhen(job.finishedAt) || formatWhen(job.runAt)
        )}</span>` +
        `</div>` +
        `<span class="module-jobs__meta">` +
        `<tc-badge variant="${STATUS_VARIANTS[job.status]}">${escapeHtml(j.statusLabels[job.status] ?? job.status)}</tc-badge>` +
        `</span>` +
        `</li>`

    const runsList = useTc<HTMLElement>({
        items: jobs,
        renderRow: runRow,
    })

    if (!jobSchedulesLoaded && jobSchedules.length === 0) return <Loading />

    return (
        <div className="module module-jobs">
            <ModuleActions>
                {canWrite && (
                    <tc-button variant="primary" size="sm" onClick={() => void runJobs()}>
                        {j.runAll}
                    </tc-button>
                )}
            </ModuleActions>

            <tc-section-card title={j.title} icon="CalendarClock">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{j.intro}</tc-text>

                    {jobSchedulesLoaded && jobSchedules.length === 0 && (
                        <tc-empty-state icon="CalendarClock">{j.empty}</tc-empty-state>
                    )}

                    {jobSchedules.length > 0 && <tc-data-list ref={scheduleList}></tc-data-list>}
                </tc-stack>
            </tc-section-card>

            <tc-section-card title={j.runsTitle} icon="History">
                <tc-stack direction="vertical" gap="0.85rem">
                    <tc-text variant="muted">{j.runsIntro}</tc-text>

                    {jobStats && (
                        <div className="module-jobs__stats">
                            <tc-badge
                                variant="secondary"
                                text={j.statsSummary(jobStats.queued, jobStats.failed)}
                            ></tc-badge>
                        </div>
                    )}

                    {!jobsLoading && jobs.length === 0 && (
                        <tc-empty-state icon="History">{j.runsEmpty}</tc-empty-state>
                    )}

                    {jobs.length > 0 && <tc-data-list ref={runsList}></tc-data-list>}

                    {jobs.length > 0 && (
                        <div className="module-jobs__more">
                            <tc-text variant="muted">{j.loadedCount(jobs.length)}</tc-text>
                            {jobsNextCursor && (
                                <tc-button
                                    variant="secondary"
                                    size="sm"
                                    outline
                                    disabled={jobsLoading || undefined}
                                    onClick={() => void fetchMoreJobs()}
                                >
                                    {j.loadMore}
                                </tc-button>
                            )}
                        </div>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default JobsAdmin
