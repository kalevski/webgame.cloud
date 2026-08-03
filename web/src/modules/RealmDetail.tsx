import React, { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import { useTc } from '@toolcase/web-components/react'
import { MODAL, useModalOpen } from 'modals'
import useStableValue from 'hooks/useStableValue'
import { PROJECT_SORTABLE, ProjectColumnKey, projectColumns, projectRow } from 'helpers/platformTables'
import { formatBytes } from 'helpers/format'
import { formatDateTime } from 'helpers/dates'
import { AdminProject, Realm, RealmHealth, RealmStatus } from 'types'

const PAGE_SIZE = 20

const SEARCH_DEBOUNCE_MS = 300

const REFRESH_MS = 30_000

const PROJECT_COLUMN_KEYS: ProjectColumnKey[] = [
    'name',
    'owner',
    'type',
    'members',
    'assets',
    'builds',
    'storage',
    'created',
    'actions',
]

type FilterableTable = HTMLElement & {
    filterValues?: Record<string, unknown>
    rows?: string
    total?: number
    limit?: number
    offset?: number
    loading?: boolean
}

const searchInput = (element: FilterableTable): HTMLInputElement | null =>
    element.shadowRoot?.querySelector<HTMLInputElement>('input[type="text"]') ??
    element.querySelector<HTMLInputElement>('input[type="text"]')

const HEALTH_DOT: Record<RealmHealth, 'online' | 'offline' | 'busy' | 'away'> = {
    healthy: 'online',
    degraded: 'away',
    unhealthy: 'busy',
    unknown: 'offline',
}

const STATUS_BADGE: Record<RealmStatus, 'success' | 'warning' | 'secondary'> = {
    active: 'success',
    draining: 'warning',
    offline: 'secondary',
}

const usageColor = (percent: number): string => {
    if (percent >= 85) return 'var(--tc-danger)'
    if (percent >= 60) return 'var(--tc-warning)'
    return 'var(--tc-success)'
}

const timeLabel = (value: string | number): string =>
    new Date(String(value)).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })

const wholeLabel = (value: number): string =>
    Number.isInteger(value) ? String(value) : ''

const percentOf = (part: number, whole: number): number =>
    whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : 0

const RealmDetail: React.FC = () => {
    const { t } = useStrings()
    const r = t.realms
    const navigate = useNavigate()
    const { id = '' } = useParams()

    const realm = useStore((state) => state.realmDetail)
    const stats = useStore((state) => state.realmStats)
    const samples = useStore((state) => state.realmSamples)
    const detailLoaded = useStore((state) => state.realmDetailLoaded)
    const fetchRealmDetail = useStore((state) => state.fetchRealmDetail)
    const clearRealmDetail = useStore((state) => state.clearRealmDetail)

    const projects = useStore((state) => state.realmProjects)
    const total = useStore((state) => state.realmProjectsTotal)
    const loading = useStore((state) => state.realmProjectsLoading)
    const filters = useStore((state) => state.realmProjectFilters)
    const fetchRealmProjects = useStore((state) => state.fetchRealmProjects)

    const deleteRealm = useStore((state) => state.deleteRealm)

    const canReadProjects = useCan('admin.project.read')
    const canWrite = useCan('realm.write')

    const openRotate = useModalOpen<boolean, Realm>(MODAL.REALM_TOKEN)
    const openDelete = useModalOpen<Realm, Realm>(MODAL.DELETE_REALM, (confirmed) => {
        if (!confirmed) return
        void deleteRealm(confirmed.id).then((removed) => {
            if (removed) navigate('/platform/realms')
        })
    })

    const filterState = useRef<Record<string, string>>({})
    const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
    const typing = useRef(false)

    useEffect(() => {
        if (!id) return
        void fetchRealmDetail(id)
        const timer = setInterval(() => void fetchRealmDetail(id), REFRESH_MS)
        return () => {
            clearInterval(timer)
            clearRealmDetail()
            if (debounce.current) clearTimeout(debounce.current)
        }
    }, [id, fetchRealmDetail, clearRealmDetail])

    useEffect(() => {
        if (id && canReadProjects) void fetchRealmProjects(id, { limit: PAGE_SIZE, offset: 0 })
    }, [id, canReadProjects, fetchRealmProjects])

    const healthLabels: Record<RealmHealth, string> = {
        healthy: r.healthHealthy,
        degraded: r.healthDegraded,
        unhealthy: r.healthUnhealthy,
        unknown: r.healthUnknown,
    }
    const statusLabels: Record<RealmStatus, string> = {
        active: r.statusActive,
        draining: r.statusDraining,
        offline: r.statusOffline,
    }

    const cpuChart = useTc<HTMLElement>({
        series: useMemo(
            () => [{
                name: r.chartCpuSeries,
                points: samples.map((sample) => ({ x: sample.t, y: sample.cpuUsage })),
            }],
            [samples, r]
        ),
        xFormatter: timeLabel,
        yFormatter: (value: number) => `${Math.round(value)}%`,
    })
    const memoryChart = useTc<HTMLElement>({
        series: useMemo(
            () => [{
                name: r.chartMemorySeries,
                points: samples.map((sample) => ({ x: sample.t, y: sample.memoryUsedBytes })),
            }],
            [samples, r]
        ),
        xFormatter: timeLabel,
        yFormatter: (value: number) => formatBytes(value),
    })
    const dangerZone = useTc<HTMLElement>({
        actions: useMemo(
            () =>
                realm
                    ? [
                        {
                            key: 'rotate',
                            title: r.rotateToken,
                            description: r.rotateHint,
                            buttonLabel: r.rotateToken,
                            icon: 'KeyRound',
                        },
                        {
                            key: 'delete',
                            title: r.deleteTitle,
                            description: realm.projectCount > 0 ? r.deleteBlocked(realm.projectCount) : r.deleteHint,
                            buttonLabel: r.deleteTitle,
                            icon: 'Trash2',
                            disabled: realm.projectCount > 0,
                        },
                    ]
                    : [],
            [realm, r]
        ),
        onactionclick: (key: string) => {
            if (!realm) return
            if (key === 'rotate') openRotate(realm)
            if (key === 'delete') openDelete(realm)
        },
    })

    const queueChart = useTc<HTMLElement>({
        series: useMemo(
            () => [{
                name: r.chartQueueSeries,
                points: samples.map((sample) => ({ x: sample.t, y: sample.queueDepth })),
            }],
            [samples, r]
        ),
        xFormatter: timeLabel,
        yFormatter: wholeLabel,
    })

    const rows = useMemo(
        () =>
            projects
                .map((project: AdminProject) => projectRow(project, t.projectsAdmin, PROJECT_COLUMN_KEYS))
                .join(''),
        [projects, t]
    )

    const table = useTc<FilterableTable>({
        columns: useStableValue(projectColumns(t.projectsAdmin, PROJECT_COLUMN_KEYS)),
        filters: useStableValue([
            { key: 'q', label: t.projectsAdmin.filterSearch, type: 'text', placeholder: r.searchProjects },
        ]),
        sortableColumns: PROJECT_SORTABLE,
        sort: useStableValue({ column: filters.sort ?? 'created', direction: filters.direction ?? 'desc' }),
        filterValues: useStableValue(filterState.current),
        rows,
        total,
        limit: PAGE_SIZE,
        offset: filters.offset ?? 0,
        loading,
        onFilterChange: (key: string, value: unknown) => {
            const next = { ...filterState.current, [key]: String(value ?? '') }
            filterState.current = next

            const element = table.current
            if (element) element.filterValues = next

            if (debounce.current) clearTimeout(debounce.current)
            typing.current = true
            debounce.current = setTimeout(
                () => void fetchRealmProjects(id, { [key]: (value as string) || undefined, offset: 0 }),
                SEARCH_DEBOUNCE_MS
            )
        },
        onSortChange: (next: { column: string; direction: 'asc' | 'desc' } | null) => {
            void fetchRealmProjects(id, {
                sort: (next?.column ?? 'created') as never,
                direction: next?.direction ?? 'desc',
                offset: 0,
            })
        },
        onPageChange: (offset: number) => {
            void fetchRealmProjects(id, { offset })
        },
    })

    useEffect(() => {
        const element = table.current
        if (!element) return

        if (!typing.current) return
        const input = searchInput(element)
        if (!input) return
        const caret = input.value.length
        input.focus()
        input.setSelectionRange(caret, caret)
    }, [table, rows, total, loading, filters.offset])

    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')
        if (!trigger) return
        if (trigger.dataset.action === 'open' && trigger.dataset.id) {
            navigate(`/platform/projects/${trigger.dataset.id}`)
        }
    }

    if (!realm) {
        return (
            <div className="module module-realm-detail">
                {detailLoaded && <tc-empty-state icon="server">{r.notFound}</tc-empty-state>}
            </div>
        )
    }

    const memoryPercent = percentOf(realm.memoryUsedBytes, realm.memoryTotalBytes)
    const storageUsed = stats?.storageUsedBytes ?? 0
    const diskFree = stats?.diskFreeBytes ?? realm.diskFreeBytes
    const diskPercent = percentOf(storageUsed, storageUsed + diskFree)
    const chartsLoading = samples.length === 0 || undefined

    return (
        <div className="module module-realm-detail" role="presentation" onClick={onClick}>
            <tc-panel bordered>
                <tc-panel-header heading={realm.name} icon="Server"></tc-panel-header>
                <div className="module-realm-detail__summary">
                    <tc-status-dot
                        status={HEALTH_DOT[realm.health]}
                        label={healthLabels[realm.health]}
                        pulse={(realm.health === 'healthy') || undefined}
                    ></tc-status-dot>
                    <tc-badge variant={STATUS_BADGE[realm.status]} text={statusLabels[realm.status]}></tc-badge>
                    {realm.exclusive && <tc-badge variant="secondary" text={r.exclusiveLabel}></tc-badge>}
                    <span className="module-realm-detail__url">{realm.baseUrl}</span>
                    <span className="module-realm-detail__meta">
                        {realm.regionName || '—'} · {r.lastSeen}: {formatDateTime(realm.lastSeenAt, r.never)}
                    </span>
                </div>
            </tc-panel>

            <tc-panel bordered>
                <tc-panel-header heading={r.resourcesTitle} icon="Gauge"></tc-panel-header>
                <div className="module-realm-detail__rings">
                    <div className="module-realm-detail__ring">
                        <tc-circular-progress
                            value={stats?.cpuUsage ?? realm.cpuUsage}
                            size="96"
                            thickness="9"
                            show-text
                            color={usageColor(stats?.cpuUsage ?? realm.cpuUsage)}
                        ></tc-circular-progress>
                        <strong>{r.ringCpu}</strong>
                        <span>{r.ringAvgPeak(stats?.avgCpuUsage ?? 0, stats?.peakCpuUsage ?? 0)}</span>
                    </div>
                    <div className="module-realm-detail__ring">
                        <tc-circular-progress
                            value={memoryPercent}
                            size="96"
                            thickness="9"
                            show-text
                            color={usageColor(memoryPercent)}
                        ></tc-circular-progress>
                        <strong>{r.ringMemory}</strong>
                        <span>{r.ringMemoryDetail(formatBytes(realm.memoryUsedBytes), formatBytes(realm.memoryTotalBytes))}</span>
                        <span>
                            {r.ringMemoryAvgPeak(
                                formatBytes(stats?.avgMemoryUsedBytes ?? realm.memoryUsedBytes),
                                formatBytes(stats?.peakMemoryUsedBytes ?? realm.memoryUsedBytes)
                            )}
                        </span>
                    </div>
                    <div className="module-realm-detail__ring">
                        <tc-circular-progress
                            value={diskPercent}
                            size="96"
                            thickness="9"
                            show-text
                            color={usageColor(diskPercent)}
                        ></tc-circular-progress>
                        <strong>{r.ringDisk}</strong>
                        <span>{r.ringDiskDetail(formatBytes(storageUsed), formatBytes(diskFree))}</span>
                    </div>
                </div>
            </tc-panel>

            <tc-panel bordered>
                <tc-panel-header heading={r.throughputTitle} icon="Activity"></tc-panel-header>
                <div className="module-realm-detail__metrics">
                    <tc-metric-tile
                        label={r.filesToday}
                        value={String(stats?.filesProcessedToday ?? 0)}
                        icon="FileCheck"
                    ></tc-metric-tile>
                    <tc-metric-tile
                        label={r.buildsToday}
                        value={String(stats?.buildsToday ?? 0)}
                        icon="Hammer"
                    ></tc-metric-tile>
                    <tc-metric-tile
                        label={r.avgDailyBuilds}
                        value={String(stats?.avgDailyBuilds ?? 0)}
                        icon="CalendarClock"
                    ></tc-metric-tile>
                    <tc-metric-tile
                        label={r.peakQueue}
                        value={String(stats?.peakQueueDepth ?? realm.queueDepth)}
                        icon="TrendingUp"
                    ></tc-metric-tile>
                </div>
            </tc-panel>

            <tc-panel bordered>
                <tc-panel-header heading={r.activityTitle} icon="ChartLine"></tc-panel-header>
                <div className="module-realm-detail__charts">
                    <tc-area-chart
                        ref={cpuChart}
                        title={r.chartCpuTitle}
                        height="220"
                        show-legend="false"
                        loading={chartsLoading}
                    ></tc-area-chart>
                    <tc-area-chart
                        ref={memoryChart}
                        title={r.chartMemoryTitle}
                        height="220"
                        show-legend="false"
                        loading={chartsLoading}
                    ></tc-area-chart>
                    <tc-area-chart
                        ref={queueChart}
                        title={r.chartQueueTitle}
                        height="220"
                        show-legend="false"
                        loading={chartsLoading}
                    ></tc-area-chart>
                </div>
            </tc-panel>

            {canReadProjects && (
                <tc-panel bordered>
                    <tc-panel-header heading={r.hostedTitle} icon="FolderKanban"></tc-panel-header>
                    <div className="module-realm-detail__projects">
                        <tc-text variant="muted">{r.hostedIntro}</tc-text>

                        <tc-advanced-table ref={table} sticky-last-column></tc-advanced-table>

                        {!loading && projects.length === 0 && (
                            <tc-empty-state icon="folder">{r.hostedEmpty}</tc-empty-state>
                        )}
                    </div>
                </tc-panel>
            )}

            {canWrite && (
                <tc-panel bordered>
                    <tc-panel-header heading={r.dangerTitle} icon="TriangleAlert"></tc-panel-header>
                    <tc-danger-zone-actions ref={dangerZone}></tc-danger-zone-actions>
                </tc-panel>
            )}
        </div>
    )
}

export default RealmDetail
