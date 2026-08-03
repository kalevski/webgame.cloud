import React from 'react'

export type EditorPanel = {
    id: string
    label: string
    content: React.ReactNode
}

type EditorTabsProps = {
    panels: EditorPanel[]
    activeId: string
    onChange: (id: string) => void
    toggle?: React.ReactNode
}

const EditorTabs: React.FC<EditorTabsProps> = ({ panels, activeId, onChange, toggle }) => (
    <div className="ed-tabs" role="tablist">
        {panels.map((panel) => (
            <button
                key={panel.id}
                type="button"
                role="tab"
                className="ed-tabs__tab"
                aria-selected={panel.id === activeId}
                data-active={panel.id === activeId ? 'true' : undefined}
                onClick={() => onChange(panel.id)}
            >
                {panel.label}
            </button>
        ))}
        {toggle}
    </div>
)

type EditorShellProps = {
    title: string
    titleLabel: string
    onTitleChange?: (next: string) => void

    onBack: () => void
    backLabel: string

    meta?: React.ReactNode
    actions?: React.ReactNode

    tools?: React.ReactNode
    toolsLabel?: string

    panels: EditorPanel[]
    activePanel: string
    onPanelChange: (id: string) => void

    dockOpen: boolean
    onDockOpenChange: (open: boolean) => void
    dockToggleLabel: string

    footer?: React.ReactNode
    status?: React.ReactNode

    children: React.ReactNode
}

const EditorShell: React.FC<EditorShellProps> = ({
    title,
    titleLabel,
    onTitleChange,
    onBack,
    backLabel,
    meta,
    actions,
    tools,
    toolsLabel,
    panels,
    activePanel,
    onPanelChange,
    dockOpen,
    onDockOpenChange,
    dockToggleLabel,
    footer,
    status,
    children,
}) => {
    const active = panels.find((panel) => panel.id === activePanel) ?? panels[0]

    return (
        <div className="ed">
            <div className="ed-toolbar">
                <button
                    type="button"
                    className="ed-btn ed-btn--icon"
                    aria-label={backLabel}
                    title={backLabel}
                    onClick={onBack}
                >
                    <tc-icon name="ArrowLeft" size="15" decorative></tc-icon>
                </button>

                {onTitleChange ? (
                    <input
                        type="text"
                        className="ed-toolbar__name"
                        aria-label={titleLabel}
                        value={title}
                        onChange={(event) => onTitleChange(event.target.value)}
                    />
                ) : (
                    <span className="ed-toolbar__name">{title}</span>
                )}

                {meta && <div className="ed-toolbar__meta">{meta}</div>}
                {actions && <div className="ed-toolbar__actions">{actions}</div>}
            </div>

            <div className="ed__body">
                {tools && (
                    <div className="ed-rail">
                        {toolsLabel && <span className="ed-rail__label ed__caps">{toolsLabel}</span>}
                        {tools}
                    </div>
                )}

                <div className="ed__center">
                    {children}
                    {footer}
                </div>

                <aside className="ed-inspector">
                    <EditorTabs panels={panels} activeId={active.id} onChange={onPanelChange} />
                    <div className="ed-panel">{active.content}</div>
                </aside>

                <div className="ed-dock" data-open={dockOpen ? 'true' : 'false'}>
                    <EditorTabs
                        panels={panels}
                        activeId={active.id}
                        onChange={(id) => {
                            onPanelChange(id)
                            onDockOpenChange(true)
                        }}
                        toggle={
                            <button
                                type="button"
                                className="ed-tabs__toggle"
                                aria-label={dockToggleLabel}
                                title={dockToggleLabel}
                                aria-expanded={dockOpen}
                                onClick={() => onDockOpenChange(!dockOpen)}
                            >
                                <tc-icon name={dockOpen ? 'ChevronDown' : 'ChevronUp'} size="16" decorative></tc-icon>
                            </button>
                        }
                    />
                    {dockOpen && <div className="ed-panel">{active.content}</div>}
                </div>
            </div>

            {status && <div className="ed-status">{status}</div>}
        </div>
    )
}

export default EditorShell
