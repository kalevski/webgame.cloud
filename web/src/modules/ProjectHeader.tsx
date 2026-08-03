import React from 'react'
import { toIconName } from 'helpers/icons'
import { Project } from 'types'

type Props = {
    title: string
    subline?: React.ReactNode
    description?: string
    action?: React.ReactNode
    project?: Project
    iconName?: string
    iconColor?: string
}

const ProjectHeader: React.FC<Props> = ({
    title,
    subline,
    description,
    action,
    project,
    iconName,
    iconColor = 'violet',
}) => (
    <tc-rich-page-header
        className="project-header"
        title-text={title}
        description={description}
        icon-name={toIconName(iconName ?? project?.icon ?? 'folder')}
        icon-color={iconColor}
    >
        {project && (
            <tc-badge slot="chips" variant="secondary" text={project.name}></tc-badge>
        )}
        {subline && (
            <span slot="chips" className="project-header__subline">
                {subline}
            </span>
        )}
        {action && <span slot="actions">{action}</span>}
    </tc-rich-page-header>
)

export default ProjectHeader
