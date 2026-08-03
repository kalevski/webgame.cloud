import React, { useCallback, useEffect, useRef } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import useCan from 'hooks/useCan'
import Loading from 'components/Loading'
import { useTc } from '@toolcase/web-components/react'
import { escapeHtml } from 'helpers/html'
import { formatDateTime } from 'helpers/dates'
import {
    PURGE_BATCH_BOUNDS,
    PURGE_INTERVAL_BOUNDS,
    PURGE_TABLES_PER_TICK_BOUNDS,
    RETENTION_MAX_DAYS,
    TableRetention,
    tableLabel,
} from 'types'

type ValueElement = HTMLElement & { value?: string }

type FilterableTable = HTMLElement & {
    rows?: string
    filterValues?: Record<string, unknown>
    total?: number
    limit?: number
}

const EMPTY_TABLES: TableRetention[] = []

const filterTables = (tables: TableRetention[], query: string): TableRetention[] => {
    const needle = query.trim().toLowerCase()
    if (!needle) return tables
    return tables.filter(
        (row) => row.table.includes(needle) || tableLabel(row.table).toLowerCase().includes(needle)
    )
}

const buildRows = (tables: TableRetention[], canWrite: boolean, daysLabel: string): string =>
    tables
        .map((row) => {
            const label = tableLabel(row.table)
            return [
                '<tr>',
                `<td><span class="module-retention__name">${escapeHtml(label)}</span>` +
                    `<code class="module-retention__code">${escapeHtml(row.table)}</code></td>`,
                `<td style="text-align:right">${row.totalRows.toLocaleString()}</td>`,
                `<td style="text-align:right">${row.softDeleted.toLocaleString()}</td>`,
                `<td style="text-align:right">${
                    row.duePurge > 0
                        ? `<tc-badge variant="warning">${row.duePurge.toLocaleString()}</tc-badge>`
                        : '—'
                }</td>`,
                `<td style="text-align:right"><input class="module-retention__days" type="number" min="0" max="${RETENTION_MAX_DAYS}"` +
                    ` value="${row.days}" data-table="${escapeHtml(row.table)}"${canWrite ? '' : ' disabled'}` +
                    ` aria-label="${escapeHtml(daysLabel)} — ${escapeHtml(label)}"></td>`,
                '</tr>',
            ].join('')
        })
        .join('')

const RetentionAdmin: React.FC = () => {
    const { t } = useStrings()
    const r = t.retention

    const retention = useStore((state) => state.retention)
    const retentionLoading = useStore((state) => state.retentionLoading)
    const fetchRetention = useStore((state) => state.fetchRetention)
    const saveRetention = useStore((state) => state.saveRetention)
    const savePurgeSettings = useStore((state) => state.savePurgeSettings)
    const runPurge = useStore((state) => state.runPurge)

    const canWrite = useCan('admin.settings.write')

    const query = useRef('')
    const draft = useRef<Map<string, number>>(new Map())

    const interval = useRef(0)
    const batch = useRef(0)
    const perTick = useRef(0)
    const intervalRef = useRef<ValueElement | null>(null)
    const batchRef = useRef<ValueElement | null>(null)
    const perTickRef = useRef<ValueElement | null>(null)

    useEffect(() => {
        void fetchRetention()
    }, [fetchRetention])

    const settings = retention?.settings

    useEffect(() => {
        if (!settings) return
        interval.current = settings.intervalSeconds
        batch.current = settings.batchSize
        perTick.current = settings.tablesPerTick

        const frame = requestAnimationFrame(() => {
            if (intervalRef.current) intervalRef.current.value = String(settings.intervalSeconds)
            if (batchRef.current) batchRef.current.value = String(settings.batchSize)
            if (perTickRef.current) perTickRef.current.value = String(settings.tablesPerTick)
        })
        return () => cancelAnimationFrame(frame)
    }, [settings])

    const tables = retention?.tables ?? EMPTY_TABLES

    const daysLabel = r.colDays

    const visible = filterTables(tables, query.current)

    const table = useTc<FilterableTable>({
        columns: [
            { key: 'table', label: r.colTable, minWidth: '16rem' },
            { key: 'rows', label: r.colRows, align: 'right', hideBelow: 'sm' },
            { key: 'soft', label: r.colSoftDeleted, align: 'right' },
            { key: 'due', label: r.colDue, align: 'right' },
            { key: 'days', label: r.colDays, align: 'right', minWidth: '9rem' },
        ],
        filters: [{ key: 'q', label: t.common.search, type: 'text', placeholder: r.colTable }],
        rows: buildRows(visible, canWrite, daysLabel),
        onFilterChange: (key: string, value: unknown) => {
            if (key !== 'q') return
            query.current = String(value ?? '')

            const element = table.current
            if (!element) return

            const matched = filterTables(tables, query.current)
            element.filterValues = { q: query.current }
            element.total = matched.length
            element.limit = Math.max(1, matched.length)
            element.rows = buildRows(matched, canWrite, daysLabel)
        },
    })

    const onInput = (event: React.FormEvent<HTMLDivElement>) => {
        const input = (event.target as HTMLElement).closest<HTMLInputElement>('[data-table]')
        if (!input) return
        const days = Number(input.value)
        draft.current.set(input.dataset.table ?? '', Number.isFinite(days) && days >= 0 ? Math.floor(days) : 0)
    }

    const savePolicy = async () => {
        if (draft.current.size === 0) return
        const policy = Object.fromEntries(draft.current)
        if (await saveRetention(policy)) draft.current.clear()
    }

    const totalDue = tables.reduce((sum, row) => sum + row.duePurge, 0)
    const enabled = tables.filter((row) => row.days > 0).length

    if (!retention && retentionLoading) return <Loading />

    return (
        <div className="module module-retention">
            <tc-section-card title={r.settingsTitle} icon="Timer">
                <span slot="action" className="section-card-actions">
                    {canWrite && (
                        <tc-button variant="secondary" size="sm" outline onClick={() => void runPurge()}>
                            {r.runNow}
                        </tc-button>
                    )}
                </span>
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{r.settingsIntro}</tc-text>

                    <div className="module-retention__settings">
                        <div className="module-retention__field">
                            <tc-form-input
                                ref={intervalRef}
                                type="number"
                                label={r.intervalLabel}
                                min={PURGE_INTERVAL_BOUNDS.min}
                                max={PURGE_INTERVAL_BOUNDS.max}
                                help={r.intervalHint}
                                disabled={!canWrite || undefined}
                                onInput={(event: React.FormEvent<ValueElement>) => {
                                    interval.current = Number((event.target as ValueElement).value ?? 0)
                                }}
                            ></tc-form-input>
                        </div>
                        <div className="module-retention__field">
                            <tc-form-input
                                ref={batchRef}
                                type="number"
                                label={r.batchLabel}
                                min={PURGE_BATCH_BOUNDS.min}
                                max={PURGE_BATCH_BOUNDS.max}
                                help={r.batchHint}
                                disabled={!canWrite || undefined}
                                onInput={(event: React.FormEvent<ValueElement>) => {
                                    batch.current = Number((event.target as ValueElement).value ?? 0)
                                }}
                            ></tc-form-input>
                        </div>
                        <div className="module-retention__field">
                            <tc-form-input
                                ref={perTickRef}
                                type="number"
                                label={r.tablesPerTickLabel}
                                min={PURGE_TABLES_PER_TICK_BOUNDS.min}
                                max={PURGE_TABLES_PER_TICK_BOUNDS.max}
                                help={r.tablesPerTickHint}
                                disabled={!canWrite || undefined}
                                onInput={(event: React.FormEvent<ValueElement>) => {
                                    perTick.current = Number((event.target as ValueElement).value ?? 0)
                                }}
                            ></tc-form-input>
                        </div>
                    </div>

                    <tc-text variant="muted">
                        {retention?.lastRun
                            ? r.lastRun(formatDateTime(retention.lastRun.startedAt), retention.lastRun.deleted)
                            : r.neverRan}
                    </tc-text>

                    {canWrite && (
                        <div className="module-retention__footer">
                            <tc-button
                                variant="primary"
                                onClick={() =>
                                    void savePurgeSettings({
                                        intervalSeconds: interval.current,
                                        batchSize: batch.current,
                                        tablesPerTick: perTick.current,
                                    })
                                }
                            >
                                {r.saveSettings}
                            </tc-button>
                        </div>
                    )}
                </tc-stack>
            </tc-section-card>

            <tc-section-card title={r.title} icon="Database">
                <tc-stack direction="column" gap="0.85rem">
                    <tc-text variant="muted">{r.intro}</tc-text>

                    <div className="module-retention__summary">
                        <tc-badge variant="secondary" text={r.enabledCount(enabled)}></tc-badge>
                        {totalDue > 0 ? (
                            <tc-badge variant="warning" text={r.dueNow(totalDue)}></tc-badge>
                        ) : (
                            <tc-badge variant="success" text={r.allClear}></tc-badge>
                        )}
                    </div>

                    <div role="presentation" onInput={onInput}>
                        <tc-advanced-table
                            ref={table}
                            total={visible.length}
                            limit={Math.max(1, visible.length)}
                            offset={0}
                        ></tc-advanced-table>
                    </div>

                    <tc-helper-text>{r.neverHint}</tc-helper-text>

                    {canWrite && (
                        <div className="module-retention__footer">
                            <tc-button variant="primary" onClick={() => void savePolicy()}>
                                {r.save}
                            </tc-button>
                        </div>
                    )}
                </tc-stack>
            </tc-section-card>
        </div>
    )
}

export default RetentionAdmin
