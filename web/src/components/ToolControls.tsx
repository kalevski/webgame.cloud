import React, { useState } from 'react'
import { useTc } from '@toolcase/web-components/react'
import { TcSelect, TcSlider, TcSwitch } from 'lib/tc'

export type ToolChoice = {
    value: string
    label: string
}

export type ToolControl =
    | {
          key: string
          kind: 'slider'
          label: string
          value: number
          min: number
          max: number
          step?: number
          suffix?: string
          onChange: (value: number) => void
      }
    | { key: string; kind: 'toggle'; label: string; value: boolean; onChange: (value: boolean) => void }
    | { key: string; kind: 'choice'; label: string; value: string; options: ToolChoice[]; onChange: (value: string) => void }
    | { key: string; kind: 'select'; label: string; value: string; options: ToolChoice[]; onChange: (value: string) => void }
    | { key: string; kind: 'color'; label: string; value: string; onChange: (value: string) => void }
    | { key: string; kind: 'text'; label: string; value: string; placeholder?: string; onChange: (value: string) => void }
    | { key: string; kind: 'textarea'; label: string; value: string; rows?: number; placeholder?: string; onChange: (value: string) => void }
    | { key: string; kind: 'divider'; label?: string }

export type ToolSection = {
    key: string
    label: string
    controls: ToolControl[]
}

type FieldProps = {
    control: ToolControl
    disabled: boolean
    revision: number
}

const ToolField: React.FC<FieldProps> = ({ control, disabled, revision }) => {
    if (control.kind === 'divider') {
        return (
            <div className="tool-controls__divider" role="separator">
                {control.label && <span className="tool-controls__label">{control.label}</span>}
            </div>
        )
    }

    if (control.kind === 'slider') {
        return (
            <div className="tool-controls__field">
                <div className="tool-controls__head">
                    <span className="tool-controls__label">{control.label}</span>
                    <span className="tool-controls__value">
                        {control.value}
                        {control.suffix ?? ''}
                    </span>
                </div>
                <TcSlider
                    value={control.value}
                    min={control.min}
                    max={control.max}
                    step={control.step ?? 1}
                    disabled={disabled || undefined}
                    onChange={control.onChange}
                />
            </div>
        )
    }

    if (control.kind === 'toggle') {
        return (
            <div className="tool-controls__field tool-controls__field--inline">
                <span className="tool-controls__label">{control.label}</span>
                <TcSwitch checked={control.value || undefined} disabled={disabled || undefined} onChange={control.onChange} />
            </div>
        )
    }

    if (control.kind === 'choice') {
        return (
            <div className="tool-controls__field">
                <span className="tool-controls__label">{control.label}</span>
                <div className="tool-controls__choice" role="group" aria-label={control.label}>
                    {control.options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={`tool-controls__pick${option.value === control.value ? ' tool-controls__pick--active' : ''}`}
                            disabled={disabled}
                            aria-pressed={option.value === control.value}
                            onClick={() => control.onChange(option.value)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        )
    }

    if (control.kind === 'select') {
        return (
            <div className="tool-controls__field">
                <span className="tool-controls__label">{control.label}</span>
                <TcSelect
                    value={control.value}
                    disabled={disabled || undefined}
                    options={control.options.map((option) => ({ value: option.value, label: option.label }))}
                    onChange={control.onChange}
                />
            </div>
        )
    }

    if (control.kind === 'textarea') {
        return (
            <div className="tool-controls__field">
                <span className="tool-controls__label">{control.label}</span>
                <textarea
                    key={`${control.key}:${revision}`}
                    className="tool-controls__input tool-controls__input--area"
                    rows={control.rows ?? 3}
                    aria-label={control.label}
                    defaultValue={control.value}
                    placeholder={control.placeholder}
                    spellCheck={false}
                    disabled={disabled}
                    onBlur={(event) => {
                        if (event.target.value !== control.value) control.onChange(event.target.value)
                    }}
                />
            </div>
        )
    }

    if (control.kind === 'color') {
        return (
            <div className="tool-controls__field tool-controls__field--inline">
                <span className="tool-controls__label">{control.label}</span>
                <span className="tool-controls__color">
                    <span className="tool-controls__hex">{control.value}</span>
                    <input
                        type="color"
                        aria-label={control.label}
                        value={control.value}
                        disabled={disabled}
                        onChange={(event) => control.onChange(event.target.value)}
                    />
                </span>
            </div>
        )
    }

    return (
        <div className="tool-controls__field">
            <span className="tool-controls__label">{control.label}</span>
            <input
                key={`${control.key}:${revision}`}
                className="tool-controls__input"
                type="text"
                aria-label={control.label}
                defaultValue={control.value}
                placeholder={control.placeholder}
                spellCheck={false}
                disabled={disabled}
                onBlur={(event) => {
                    if (event.target.value !== control.value) control.onChange(event.target.value)
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter') (event.target as HTMLInputElement).blur()
                }}
            />
        </div>
    )
}

type InlineProps = {
    controls: ToolControl[]
    disabled?: boolean
    revision?: number
}

export const ToolInlineControls: React.FC<InlineProps> = ({ controls, disabled = false, revision = 0 }) => (
    <div className="tool-controls tool-controls--inline">
        {controls.map((control) => (
            <ToolField key={control.key} control={control} disabled={disabled} revision={revision} />
        ))}
    </div>
)

type Props = {
    sections: ToolSection[]
    disabled?: boolean
    revision?: number
}

const ToolControls: React.FC<Props> = ({ sections, disabled = false, revision = 0 }) => {
    const [activeKey, setActiveKey] = useState('')
    const active = sections.find((section) => section.key === activeKey) ?? sections[0]

    const tabs = useTc<HTMLElement>(
        { tabs: sections.map((section) => ({ id: section.key, label: section.label })) },
        {
            'tc-change': (event: Event) =>
                setActiveKey((event as CustomEvent<{ id: string }>).detail.id),
        }
    )

    if (!active) return null

    return (
        <div className="tool-controls">
            <tc-tab-bar ref={tabs} size="sm" active-id={active.key}></tc-tab-bar>
            <div className="tool-controls__grid">
                {active.controls.map((control) => (
                    <ToolField key={control.key} control={control} disabled={disabled} revision={revision} />
                ))}
            </div>
        </div>
    )
}

export default ToolControls
