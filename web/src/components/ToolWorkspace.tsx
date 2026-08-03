import React from 'react'
import ToolControls, { ToolSection } from 'components/ToolControls'

export type WorkspaceTool = {
    key: string
    icon: string
    label: string
    active?: boolean
    disabled?: boolean
    onSelect: () => void
}

export type WorkspaceAction = {
    key: string
    icon: string
    label: string
    variant?: 'primary' | 'secondary' | 'danger'
    disabled?: boolean
    onExec: () => void
}

export type WorkspaceRailEntry = WorkspaceTool | 'separator'

type Props = {
    tools?: WorkspaceRailEntry[]
    activeTool?: string
    toolsLabel?: string
    options?: React.ReactNode
    actions?: WorkspaceAction[]
    panels: ToolSection[]
    panelsDisabled?: boolean
    revision?: number
    status?: React.ReactNode
    children: React.ReactNode
}

const ToolWorkspace: React.FC<Props> = ({
    tools,
    activeTool,
    toolsLabel,
    options,
    actions,
    panels,
    panelsDisabled = false,
    revision = 0,
    status,
    children,
}) => (
    <div className={`tool-shell${tools && tools.length > 0 ? '' : ' tool-shell--no-rail'}`}>
        <div className="tool-shell__options">
            <div className="tool-shell__options-fields">{options}</div>
            {actions && actions.length > 0 && (
                <div className="tool-shell__options-actions">
                    {actions.map((action) => (
                        <tc-icon-button
                            key={action.key}
                            icon={action.icon}
                            variant={action.variant ?? 'secondary'}
                            size="small"
                            outline={action.variant === 'primary' ? undefined : true}
                            label={action.label}
                            title={action.label}
                            disabled={action.disabled || undefined}
                            onClick={() => {
                                if (!action.disabled) action.onExec()
                            }}
                        ></tc-icon-button>
                    ))}
                </div>
            )}
        </div>

        {tools && tools.length > 0 && (
            <div className="tool-shell__rail" role="toolbar" aria-orientation="vertical" aria-label={toolsLabel}>
                {tools.map((tool, index) => {
                    if (tool === 'separator') {
                        return <hr key={`separator-${index}`} className="tool-shell__rail-divider" />
                    }
                    const active = tool.active ?? tool.key === activeTool
                    return (
                        <tc-icon-button
                            key={tool.key}
                            className={active ? 'tool-shell__tool tool-shell__tool--active' : 'tool-shell__tool'}
                            icon={tool.icon}
                            variant="secondary"
                            size="small"
                            label={tool.label}
                            title={tool.label}
                            aria-pressed={active}
                            disabled={tool.disabled || undefined}
                            onClick={() => {
                                if (!tool.disabled) tool.onSelect()
                            }}
                        ></tc-icon-button>
                    )
                })}
            </div>
        )}

        <div className="tool-shell__stage">
            <div className="tool-shell__canvas">{children}</div>
        </div>

        <aside className="tool-shell__dock">
            <ToolControls sections={panels} disabled={panelsDisabled} revision={revision} />
        </aside>

        <div className="tool-shell__status">{status}</div>
    </div>
)

export default ToolWorkspace
