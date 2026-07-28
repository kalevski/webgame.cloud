import React, { useEffect } from 'react'
import { useStore } from 'state'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import Loading from 'components/Loading'

const CATEGORICAL = ['#2563eb', '#d97706', '#7c3aed', '#059669']

const wholeNumbersOnly = (value: number) => (Number.isInteger(value) ? String(value) : '')

const AdminOverview: React.FC = () => {
    const { t } = useStrings()
    const o = t.overview
    const p = t.projects
    const overview = useStore((state) => state.overview)
    const fetchOverview = useStore((state) => state.fetchOverview)

    useEffect(() => {
        fetchOverview()
    }, [fetchOverview])

    const statusLabel: Record<string, string> = {
        planned: p.statusPlanned,
        'in-progress': p.statusInProgress,
        shipped: p.statusShipped,
        private: p.visibilityPrivate,
        shared: p.visibilityShared,
    }

    const signupsArea = useTc<HTMLElement>({
        series: overview
            ? [
                  {
                      name: o.signupsSeries,
                      color: CATEGORICAL[0],
                      points: overview.signupsByWeek.map((entry) => ({
                          x: entry.week,
                          y: entry.count,
                      })),
                  },
              ]
            : [],
        xFormatter: (value: string | number) =>
            new Date(String(value)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        yFormatter: wholeNumbersOnly,
    })

    const buildsTotal = overview?.buildsByStatus.reduce((sum, entry) => sum + entry.count, 0) ?? 0
    const buildsDonut = useTc<HTMLElement>({
        data: (overview?.buildsByStatus ?? []).map((entry, index) => ({
            label: statusLabel[entry.status] ?? entry.status,
            value: entry.count,
            color: CATEGORICAL[index % CATEGORICAL.length],
        })),
        centerLabel: String(buildsTotal),
    })

    const appTypePie = useTc<HTMLElement>({
        data: (overview?.projectsByAppType ?? []).map((entry, index) => ({
            label: statusLabel[entry.appType] ?? entry.appType,
            value: entry.count,
            color: CATEGORICAL[index % CATEGORICAL.length],
        })),
    })

    const rolesBar = useTc<HTMLElement>({
        data: (overview?.usersByRole ?? []).map((entry, index) => ({
            label: entry.name,
            value: entry.count,
            color: CATEGORICAL[index % CATEGORICAL.length],
        })),
        yFormatter: wholeNumbersOnly,
    })

    if (!overview) return <Loading />

    const tiles: Array<{ label: string; value: string | number }> = [
        { label: o.wau, value: overview.wau },
        { label: o.retention, value: overview.d30Retention !== null ? `${overview.d30Retention}%` : o.na },
        { label: o.buildsTotal, value: overview.buildsTotal },
        { label: o.reportQueue, value: overview.reportQueue.pending },
    ]

    const signupsBaseline = overview.signupsTotal - overview.signupsLast30
    const projectsBaseline = overview.projectsTotal - overview.projectsLast30

    return (
        <div className="module module-overview">
            <tc-grid columns={1} columns-md={2} gap="1.5rem" className="module-overview__trends">
                <tc-difference-card
                    title={o.signupsTotal}
                    value={overview.signupsTotal}
                    previous-value={signupsBaseline}
                    period={signupsBaseline > 0 ? o.last30Period : undefined}
                ></tc-difference-card>
                <tc-difference-card
                    title={o.projectsTotal}
                    value={overview.projectsTotal}
                    previous-value={projectsBaseline}
                    period={projectsBaseline > 0 ? o.last30Period : undefined}
                ></tc-difference-card>
            </tc-grid>

            <tc-metric-grid columns="4">
                {tiles.map((tile) => (
                    <tc-metric-tile key={tile.label} label={tile.label} value={String(tile.value)}></tc-metric-tile>
                ))}
            </tc-metric-grid>

            <tc-chart-container title={o.signupsChart} subtitle={o.signupsChartSubtitle}>
                <tc-area-chart ref={signupsArea} height="220" show-legend="false"></tc-area-chart>
            </tc-chart-container>

            <tc-grid columns={1} columns-md={3} gap="1.5rem">
                <tc-chart-container title={o.tasksChart}>
                    {buildsTotal > 0 ? (
                        <tc-pie-chart ref={buildsDonut} donut height="220"></tc-pie-chart>
                    ) : (
                        <tc-empty-state icon="list-checks">{o.noData}</tc-empty-state>
                    )}
                </tc-chart-container>
                <tc-chart-container title={o.projectsChart}>
                    {overview.projectsByAppType.length > 0 ? (
                        <tc-pie-chart ref={appTypePie} height="220"></tc-pie-chart>
                    ) : (
                        <tc-empty-state icon="folder">{o.noData}</tc-empty-state>
                    )}
                </tc-chart-container>
                <tc-chart-container title={o.rolesChart}>
                    <tc-bar-chart
                        ref={rolesBar}
                        orientation="horizontal"
                        height="220"
                        show-values
                    ></tc-bar-chart>
                </tc-chart-container>
            </tc-grid>
        </div>
    )
}

export default AdminOverview
