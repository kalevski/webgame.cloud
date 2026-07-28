import React from 'react'
import { usePageContext } from 'contexts/PageContext'
import { useStore } from 'state'

/**
 * Navbar orientation strip. The page itself carries the H1 and the live
 * subline, so this states *where* you are — project, then screen — and stops.
 */
const PageHeader: React.FC = () => {
    const { pageTitle, pageDescription } = usePageContext()
    const projects = useStore((state) => state.projects)
    const activeProjectId = useStore((state) => state.activeProjectId)

    const project = projects.find((entry) => entry.id === activeProjectId) ?? null
    const inProject = project !== null && window.location.pathname.startsWith('/projects/')

    return (
        <div className="module module-page-header">
            {inProject && (
                <>
                    <span className="module-page-header__crumb">{project!.name}</span>
                    <span className="module-page-header__separator" aria-hidden="true">
                        /
                    </span>
                </>
            )}
            <span className="module-page-header__title">{pageTitle}</span>
            {!inProject && pageDescription && (
                <span className="module-page-header__description">{pageDescription}</span>
            )}
        </div>
    )
}

export default PageHeader
