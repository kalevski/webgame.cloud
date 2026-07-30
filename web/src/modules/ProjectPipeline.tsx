import React, { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import Icon from 'components/icons'
import { Project } from 'types'

type Props = {
    project: Project
}

type Stage = {
    key: string
    label: string
    icon: string
    count: number
    detail: string | null
    tags?: string[]
    working?: boolean
    to: string
}

const ProjectPipeline: React.FC<Props> = ({ project }) => {
    const { t } = useStrings()
    const p = t.pipeline
    const { pathname } = useLocation()

    const assets = useStore((state) => state.assets)
    const bundles = useStore((state) => state.bundles)
    const builds = useStore((state) => state.builds)
    const fetchBundles = useStore((state) => state.fetchBundles)
    const fetchBuilds = useStore((state) => state.fetchBuilds)

    useEffect(() => {
        void fetchBundles(project.id)
        void fetchBuilds(project.id)
    }, [project.id, fetchBundles, fetchBuilds])

    const stages: Stage[] = useMemo(() => {
        const assetCount = assets.length || project.assetCount
        const untagged = assets.length > 0 ? assets.filter((asset) => asset.tags.length === 0).length : null

        const neverBuilt = bundles.filter((bundle) => bundle.buildCount === 0).length
        const inFlight = builds.filter((build) => build.status === 'queued' || build.status === 'running').length
        const failed = builds.filter((build) => build.status === 'fail').length
        const tagged = new Set<string>()
        for (const build of builds) {
            if (build.status === 'pass' && build.buildTag) tagged.add(build.buildTag)
        }
        const liveTags = [...tagged]

        const assetDetail = (): string | null => {
            if (assetCount === 0) return p.noAssets
            if (untagged === null) return null
            return untagged > 0 ? p.untagged(untagged) : p.allTagged
        }

        const buildDetail = (): string | null => {
            if (builds.length === 0) return p.noBuilds
            if (inFlight > 0) return p.inFlight(inFlight)
            if (failed > 0) return p.failed(failed)
            return p.allPassed
        }

        return [
            {
                key: 'assets',
                label: p.assets,
                icon: 'image',
                count: assetCount,
                detail: assetDetail(),
                to: 'assets',
            },
            {
                key: 'bundles',
                label: p.bundles,
                icon: 'package',
                count: bundles.length,
                detail: bundles.length === 0
                    ? p.noBundles
                    : neverBuilt > 0 ? p.neverBuilt(neverBuilt) : p.allBuilt,
                to: 'bundles',
            },
            {
                key: 'builds',
                label: p.builds,
                icon: 'hammer',
                count: builds.length,
                detail: buildDetail(),
                working: inFlight > 0,
                to: 'builds',
            },
            {
                key: 'live',
                label: p.live,
                icon: 'radio',
                count: liveTags.length,
                detail: liveTags.length === 0 ? p.nothingLive : null,
                tags: liveTags,
                to: 'live',
            },
        ]
    }, [assets, bundles, builds, project.assetCount, p])

    const activeIndex = stages.findIndex((stage) => pathname.endsWith(`/${stage.to}`))

    return (
        <nav className="project-pipeline" aria-label={p.label}>
            {stages.map((stage, index) => {
                const state = index === activeIndex
                    ? 'current'
                    : index < activeIndex ? 'done' : 'ahead'
                return (
                    <React.Fragment key={stage.key}>
                        {index > 0 && (
                            <span
                                className="project-pipeline__flow"
                                data-flowing={stage.count > 0 ? 'true' : 'false'}
                                aria-hidden="true"
                            >
                                <Icon name="chevron-right" size={14} />
                            </span>
                        )}
                        <Link
                            to={`/projects/${project.id}/${stage.to}`}
                            className="project-pipeline__stage"
                            data-stage={stage.key}
                            data-state={state}
                            aria-current={index === activeIndex ? 'page' : undefined}
                        >
                            <span className="project-pipeline__head">
                                <span className="project-pipeline__tile">
                                    <Icon name={stage.icon} size={14} />
                                </span>
                                <span className="project-pipeline__label">{stage.label}</span>
                                {stage.working && (
                                    <span className="project-pipeline__pulse" aria-hidden="true" />
                                )}
                            </span>

                            <span className="project-pipeline__count">{stage.count}</span>

                            {stage.tags && stage.tags.length > 0 ? (
                                <span className="project-pipeline__tags">
                                    {stage.tags.slice(0, 2).map((tag) => (
                                        <span key={tag} className="project-pipeline__tag">{tag}</span>
                                    ))}
                                    {stage.tags.length > 2 && (
                                        <span className="project-pipeline__tag project-pipeline__tag--more">
                                            {p.moreTags(stage.tags.length - 2)}
                                        </span>
                                    )}
                                </span>
                            ) : (
                                <span className="project-pipeline__detail">{stage.detail}</span>
                            )}
                        </Link>
                    </React.Fragment>
                )
            })}
        </nav>
    )
}

export default ProjectPipeline
