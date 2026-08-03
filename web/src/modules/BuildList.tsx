import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    TcActionItem,
    TcBuild,
    TcButton,
    TcGroup,
    TcSkeleton,
} from 'lib/tc'
import useStrings from 'hooks/useStrings'
import useWhen from 'hooks/useWhen'
import { useStore } from 'state'
import { useProjectCan } from 'hooks/useProjectCan'
import BuildIntegrationGuide from 'components/BuildIntegrationGuide'
import FilterBar from 'components/FilterBar'
import { Build, BuildStatus, Project } from 'types'

type Props = {
    project: Project
}

type BundleGroup = {
    id: string
    name: string
    builds: Build[]
}

const ALL_STATUSES = '__all__'

const GROUP_LIMIT = 10
const POLL_MS = 2500

const BuildList: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const b = t.builds
    const when = useWhen()

    const builds = useStore((state) => state.builds)
    const buildsLoaded = useStore((state) => state.buildsLoaded)
    const bundles = useStore((state) => state.bundles)
    const categoriesAndTags = useStore((state) => state.categoriesAndTags)
    const fetchBuilds = useStore((state) => state.fetchBuilds)
    const fetchBundles = useStore((state) => state.fetchBundles)
    const fetchCategoriesAndTags = useStore((state) => state.fetchCategoriesAndTags)
    const runBuild = useStore((state) => state.runBuild)
    const deleteBuild = useStore((state) => state.deleteBuild)
    const setBuildTag = useStore((state) => state.setBuildTag)

    const canRun = useProjectCan('build.run')
    const timer = useRef<ReturnType<typeof setInterval> | null>(null)

    const [statusFilter, setStatusFilter] = useState<BuildStatus | null>(null)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [integrationBuild, setIntegrationBuild] = useState<Build | null>(null)

    useEffect(() => {
        void fetchBuilds(project.id)
        void fetchBundles(project.id)
        void fetchCategoriesAndTags(project.id)
    }, [project.id, fetchBuilds, fetchBundles, fetchCategoriesAndTags])

    const running = builds.some((build) => build.status === 'queued' || build.status === 'running')

    useEffect(() => {
        if (!running) {
            if (timer.current) clearInterval(timer.current)
            timer.current = null
            return
        }
        timer.current = setInterval(() => void fetchBuilds(project.id), POLL_MS)
        return () => {
            if (timer.current) clearInterval(timer.current)
            timer.current = null
        }
    }, [running, project.id, fetchBuilds])

    const buildActions: TcActionItem[] = [
        { key: 'integrate', label: b.integrateTitle, icon: 'code-slash' },
        ...(canRun
            ? [
                { key: 'manage_tag', label: b.manageTag, icon: 'tags' },
                { key: 'delete', label: b.delete, icon: 'x' },
            ]
            : []),
    ]

    const filtered = statusFilter ? builds.filter((build) => build.status === statusFilter) : builds

    const statusCounts = useMemo(() => {
        const counts = new Map<string, number>()
        for (const build of builds) counts.set(build.status, (counts.get(build.status) ?? 0) + 1)
        return counts
    }, [builds])

    const groups = filtered.reduce((all: BundleGroup[], build) => {
        let group = all.find((entry) => entry.id === build.bundleId)
        if (!group) {
            group = { id: build.bundleId, name: build.bundleName || build.bundleId, builds: [] }
            all.push(group)
        }
        group.builds.push(build)
        return all
    }, [])

    const handleBuildMenuClick = (build: Build, key: string) => {
        if (key === 'integrate') setIntegrationBuild(build)
        if (key === 'delete') void deleteBuild(project.id, build.id)
        if (key === 'manage_tag') {
            const next = build.buildTag
                ? ''
                : categoriesAndTags?.buildTags[0]?.name ?? ''
            void setBuildTag(project.id, build.id, next)
        }
    }

    const chips: Array<{ key: BuildStatus; label: string }> = [
        { key: 'pass', label: b.status.pass },
        { key: 'fail', label: b.status.fail },
        { key: 'running', label: b.status.running },
        { key: 'queued', label: b.status.queued },
    ]

    return (
        <>
            <p className="console-hint">{b.groupedHint}</p>

            <FilterBar
                rows={[
                    {
                        key: 'status',
                        legend: b.filterStatusLabel,
                        chips: [
                            { id: ALL_STATUSES, label: b.filterAll, count: builds.length },
                            ...chips.map((chip) => ({
                                id: chip.key,
                                label: chip.label,
                                count: statusCounts.get(chip.key) ?? 0,
                            })),
                        ],
                        value: statusFilter ?? ALL_STATUSES,
                        onChange: (id: string | null) =>
                            setStatusFilter(!id || id === ALL_STATUSES ? null : (id as BuildStatus)),
                    },
                ]}
                total={builds.length}
                matches={filtered.length}
                unit={builds.length === 1 ? b.buildWord : b.buildsWord}
                active={statusFilter !== null}
                onClear={() => setStatusFilter(null)}
            />

            {!buildsLoaded ? (
                <div className="d-flex flex-column gap-2 mt-2">
                    <TcSkeleton variant="rect" height={48} />
                    <TcSkeleton variant="rect" height={48} />
                    <TcSkeleton variant="rect" height={48} />
                </div>
            ) : groups.length === 0 ? (
                <div className="console-empty">
                    <p className="console-empty__title">
                        {statusFilter ? b.emptyFilteredTitle : b.emptyTitle}
                    </p>
                    <p className="console-empty__body">{statusFilter ? b.emptyFiltered : b.empty}</p>
                </div>
            ) : null}

            {groups.map((group) => {
                const isExpanded = expanded.has(group.id)
                const visible = isExpanded ? group.builds : group.builds.slice(0, GROUP_LIMIT)
                const hasMore = group.builds.length > GROUP_LIMIT
                const bundle = bundles.find((entry) => entry.id === group.id)

                return (
                    <TcGroup
                        key={group.id}
                        label={group.name}
                        badge={b.buildCount(group.builds.length)}
                        actionIcon={canRun && bundle ? 'play' : ''}
                        actionLabel={b.buildNow}
                        onActionClick={
                            canRun && bundle ? () => void runBuild(project.id, group.id) : undefined
                        }
                    >
                        {visible.map((build) => (
                            <div key={build.id} className="build-list__item">
                                <TcBuild
                                    name={build.id.slice(0, 8)}
                                    badge={build.buildTag || undefined}
                                    badgeVariant={build.buildTag ? 'info' : undefined}
                                    date={when(build.createdAt)}
                                    size={build.sizeBytes}
                                    duration={build.durationMs}
                                    status={build.status}
                                    menuItems={buildActions}
                                    onMenuItemClick={(key) => handleBuildMenuClick(build, key)}
                                    onClick={() => setIntegrationBuild(build)}
                                />
                            </div>
                        ))}
                        {hasMore && !isExpanded && (
                            <div className="build-list__show-all">
                                <TcButton
                                    variant="primary"
                                    outline
                                    size="small"
                                    onClick={() => setExpanded((current) => new Set([...current, group.id]))}
                                >
                                    {b.showAll(group.builds.length)}
                                </TcButton>
                            </div>
                        )}
                    </TcGroup>
                )
            })}

            <BuildIntegrationGuide
                build={integrationBuild}
                projectId={project.id}
                onClose={() => setIntegrationBuild(null)}
            />
        </>
    )
}

export default BuildList
