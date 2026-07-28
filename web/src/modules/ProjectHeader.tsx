import React from 'react'

type Props = {
    title: string
    subline?: React.ReactNode
    action?: React.ReactNode
}

const ProjectHeader: React.FC<Props> = ({ title, subline, action }) => (
    <header className="project-header">
        <div className="project-header__text">
            <h1 className="project-header__title">{title}</h1>
            {subline && <p className="project-header__subline">{subline}</p>}
        </div>
        {action && <div className="project-header__action">{action}</div>}
    </header>
)

export default ProjectHeader
