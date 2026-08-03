import React, { useRef, useState } from 'react'
import { TcButton, TcExtendedSelect, TcSpinner } from 'lib/tc'
import useStrings from 'hooks/useStrings'
import { baseName, slug } from 'helpers/naming'
import ToolWorkspace, { WorkspaceAction, WorkspaceRailEntry } from 'components/ToolWorkspace'
import FloatingActionBar from 'components/FloatingActionBar'
import { ToolSection } from 'components/ToolControls'

export type ToolPickerItem = {
    key: string
    name: string
    description?: string
}

export type ToolPicker = {
    label: string
    items: ToolPickerItem[]
    value: string
    placeholder?: string
    searchPlaceholder?: string
    loading?: boolean
    loadingText?: string
    onChange: (key: string) => void
}

type Props = {
    alerts?: React.ReactNode
    picker: ToolPicker
    options?: React.ReactNode
    tools?: WorkspaceRailEntry[]
    activeTool?: string
    toolsLabel?: string
    actions?: WorkspaceAction[]
    panels: ToolSection[]
    panelsDisabled?: boolean
    revision?: number
    status?: React.ReactNode
    canWrite: boolean
    defaultName: string
    saveDisabled?: boolean
    hint?: string
    onSave: (name: string) => Promise<void>
    children: React.ReactNode
}

const ToolShell: React.FC<Props> = ({
    alerts,
    picker,
    options,
    tools,
    activeTool,
    toolsLabel,
    actions,
    panels,
    panelsDisabled = false,
    revision = 0,
    status,
    canWrite,
    defaultName,
    saveDisabled = false,
    hint,
    onSave,
    children,
}) => {
    const { t } = useStrings()
    const s = t.tools

    const assetName = useRef('')
    const [saving, setSaving] = useState(false)

    const save = async () => {
        const typed = assetName.current.trim()
        const name = typed ? slug(baseName(typed)) : defaultName
        setSaving(true)
        try {
            await onSave(name)
        } finally {
            setSaving(false)
        }
    }

    const optionFields = (
        <>
            <label className="tool-shell__field">
                <span className="tool-controls__label">{picker.label}</span>
                <TcExtendedSelect
                    className="tool-shell__select"
                    items={picker.items}
                    value={picker.value}
                    placeholder={picker.placeholder}
                    searchPlaceholder={picker.searchPlaceholder}
                    onChange={picker.onChange}
                />
            </label>
            {options}
            {picker.loading && (
                <span className="tool-page__hint">
                    <TcSpinner size="small" /> {picker.loadingText}
                </span>
            )}
        </>
    )

    return (
        <div className="tool-page">
            {alerts}

            <ToolWorkspace
                tools={tools}
                activeTool={activeTool}
                toolsLabel={toolsLabel}
                options={optionFields}
                actions={actions}
                panels={panels}
                panelsDisabled={panelsDisabled}
                revision={revision}
                status={status}
            >
                {children}
            </ToolWorkspace>

            {!canWrite && (
                <div className="tool-page__actions">
                    <span className="tool-page__hint">{s.noWriteHint}</span>
                </div>
            )}

            <FloatingActionBar
                visible={canWrite}
                label={
                    <>
                        <label className="tool-page__name">
                            <span className="tool-page__name-label">{s.outputName}</span>
                            <input
                                type="text"
                                spellCheck={false}
                                placeholder={defaultName}
                                onBlur={(event) => {
                                    assetName.current = event.target.value
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
                                }}
                            />
                        </label>
                        {hint && <span className="tool-page__hint">{hint}</span>}
                    </>
                }
            >
                <TcButton
                    variant="primary"
                    disabled={saveDisabled || saving || undefined}
                    onClick={() => void save()}
                >
                    {s.save}
                </TcButton>
            </FloatingActionBar>
        </div>
    )
}

export default ToolShell
