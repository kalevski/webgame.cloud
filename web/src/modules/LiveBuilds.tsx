import React, { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import AdvancedTable from 'components/AdvancedTable'
import { escapeHtml } from 'helpers/html'
import { formatBytes } from 'helpers/format'
import { formatDateTime } from 'helpers/dates'
import { Project } from 'types'

type Props = {
    project: Project
}

const STATUS_VARIANTS: Record<string, string> = {
    pass: 'success',
    fail: 'danger',
    running: 'info',
    queued: 'warning',
}

const LiveBuilds: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const l = t.live

    const navigate = useNavigate()
    const builds = useStore((state) => state.builds)
    const buildsLoaded = useStore((state) => state.buildsLoaded)
    const fetchBuilds = useStore((state) => state.fetchBuilds)

    useEffect(() => {
        void fetchBuilds(project.id)
    }, [project.id, fetchBuilds])

    const passed = useMemo(() => builds.filter((build) => build.status === 'pass'), [builds])

    const rows = useMemo(
        () =>
            builds
                .map((build) =>
                    [
                        '<tr>',
                        `<td><strong>${escapeHtml(build.id.slice(0, 8))}</strong></td>`,
                        `<td>${escapeHtml(build.bundleName)}</td>`,
                        `<td><tc-badge variant="${STATUS_VARIANTS[build.status] ?? 'secondary'}">${escapeHtml(
                            t.builds.status[build.status] ?? build.status
                        )}</tc-badge></td>`,
                        `<td>${
                            build.buildTag
                                ? `<tc-badge variant="primary">${escapeHtml(build.buildTag)}</tc-badge>`
                                : `<span class="member-table__muted">${escapeHtml(l.untagged)}</span>`
                        }</td>`,
                        `<td style="text-align:right">${escapeHtml(formatBytes(build.sizeBytes))}</td>`,
                        `<td>${escapeHtml(formatDateTime(build.createdAt))}</td>`,
                        '<td style="text-align:right"><span class="table-actions">' +
                            `<tc-icon-button icon="ArrowRight" variant="primary" size="small" outline data-action="open" data-id="${escapeHtml(
                                build.id
                            )}" label="${escapeHtml(l.open)}" title="${escapeHtml(l.open)}"></tc-icon-button>` +
                            '</span></td>',
                        '</tr>',
                    ].join('')
                )
                .join(''),
        [builds, l, t]
    )

    return (
        <div className="module module-live-builds">
            <tc-metric-grid columns="3">
                <tc-metric-tile label={l.metricLive} value={String(passed.length)}></tc-metric-tile>
                <tc-metric-tile label={l.metricTotal} value={String(builds.length)}></tc-metric-tile>
                <tc-metric-tile
                    label={l.metricTagged}
                    value={String(passed.filter((build) => build.buildTag).length)}
                ></tc-metric-tile>
            </tc-metric-grid>

            <tc-alert variant="info">{l.intro}</tc-alert>

            <tc-section-card title={l.tableTitle}>
                <div>
                    <tc-empty-state icon="rocket" hidden={builds.length > 0 || undefined}>
                        {l.empty}
                    </tc-empty-state>
                    <AdvancedTable
                        columns={[
                            { key: 'id', label: l.colBuild, minWidth: '8rem' },
                            { key: 'bundle', label: l.colBundle, minWidth: '10rem' },
                            { key: 'status', label: l.colStatus },
                            { key: 'tag', label: l.colTag },
                            { key: 'size', label: l.colSize, align: 'right' },
                            { key: 'created', label: l.colCreated, hideBelow: 'md' },
                            { key: 'actions', label: '', align: 'right', minWidth: '4rem' },
                        ]}
                        rows={rows}
                        total={builds.length}
                        offset={0}
                        limit={Math.max(builds.length, 1)}
                        loading={!buildsLoaded}
                        stickyLastColumn
                        onRowAction={(action, id) => {
                            if (action === 'open') navigate(`/projects/${project.id}/live/${id}`)
                        }}
                    />
                </div>
            </tc-section-card>
        </div>
    )
}

export default LiveBuilds
