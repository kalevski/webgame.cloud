import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import useStrings from 'hooks/useStrings'
import { useStore } from 'state'
import { Project } from 'types'

type Props = {
    project: Project
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

    const live = builds.filter((build) => build.status === 'pass' && build.buildTag).length

    const stages = [
        { key: 'assets', label: p.assets, count: assets.length || project.assetCount, to: 'assets' },
        { key: 'bundles', label: p.bundles, count: bundles.length, to: 'bundles' },
        { key: 'builds', label: p.builds, count: builds.length, to: 'builds' },
        { key: 'live', label: p.live, count: live, to: 'builds' },
    ]

    const activeIndex = stages.findIndex((stage) => pathname.endsWith(`/${stage.to}`))

    return (
        <nav className="project-pipeline" aria-label={p.label}>
            {stages.map((stage, index) => {
                const state = index === activeIndex
                    ? 'current'
                    : index < activeIndex ? 'done' : 'ahead'
                return (
                    <React.Fragment key={stage.key}>
                        {index > 0 && <span className="project-pipeline__link" aria-hidden="true" />}
                        <Link
                            to={`/projects/${project.id}/${stage.to}`}
                            className="project-pipeline__stage"
                            data-state={state}
                            aria-current={index === activeIndex ? 'page' : undefined}
                        >
                            <span className="project-pipeline__label">{stage.label}</span>
                            <span className="project-pipeline__count">{stage.count}</span>
                        </Link>
                    </React.Fragment>
                )
            })}
        </nav>
    )
}

export default ProjectPipeline
