import React from 'react'
import { DEFAULT_PROJECT_COLOR, DEFAULT_PROJECT_ICON } from 'configs/genres'
import { toIconName } from 'helpers/icons'

type ProjectIconTileProps = {
    icon: string
    color: string
    size?: 'sm' | 'md' | 'lg'
    name?: string
}

type TileStyle = React.CSSProperties & { '--project-color': string }

const ICON_SIZE: Record<'sm' | 'md' | 'lg', string> = { sm: '16', md: '22', lg: '34' }

const ProjectIconTile: React.FC<ProjectIconTileProps> = ({ icon, color, size = 'md', name }) => (
    <span
        className="project-icon-tile"
        data-size={size}
        style={{ '--project-color': color || DEFAULT_PROJECT_COLOR } as TileStyle}
        title={name}
    >
        <tc-icon name={toIconName(icon || DEFAULT_PROJECT_ICON)} size={ICON_SIZE[size]}></tc-icon>
    </span>
)

export default ProjectIconTile
