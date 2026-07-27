import React, { useEffect, useState } from 'react'
import useStrings from 'hooks/useStrings'
import { useTc } from '@toolcase/web-components/react'
import { MODAL } from './keys'
import { useModalClose, useModalInput } from './registry'

export type FilterFieldOption = { key: string; label: string; keywords?: string[] }

export type FilterField = {
    key: string
    label: string
    kind: 'select' | 'combo' | 'chips' | 'chips-multi' | 'range'

    options?: FilterFieldOption[]

    value?: string

    values?: string[]

    range?: [number, number]
    rangeMin?: number
    rangeMax?: number
    rangeStep?: number

    emptyKey?: string
}

export type FiltersInput = { fields: FilterField[] }
export type FiltersResult = Record<string, string | string[] | [number, number]>

const emptyValueOf = (field: FilterField): string | string[] | [number, number] => {
    if (field.kind === 'chips-multi') return []
    if (field.kind === 'range') return [field.rangeMin ?? 0, field.rangeMax ?? 100]
    if (field.kind === 'select') return field.emptyKey ?? 'all'
    return ''
}

const FieldSelect: React.FC<{
    field: FilterField
    value: string
    onChange: (value: string) => void
}> = ({ field, value, onChange }) => {
    const { t } = useStrings()
    const select = useTc<HTMLElement>({
        items: field.options ?? [],
        value,
        onChange,
    })
    return (
        <tc-extended-select
            ref={select}
            search-placeholder={t.common.search}
            no-results-text={t.common.noResults}
        ></tc-extended-select>
    )
}

const FieldCombo: React.FC<{
    field: FilterField
    value: string
    onChange: (value: string) => void
}> = ({ field, value, onChange }) => {
    const combo = useTc<HTMLElement>({
        options: (field.options ?? []).map((option) => ({
            value: option.key,
            label: option.label,
            keywords: option.keywords,
        })),
        value,
        onChange: (next: string) => onChange(next ?? ''),
    })
    return <tc-combo-box ref={combo} max-height="240"></tc-combo-box>
}

const FieldRange: React.FC<{
    field: FilterField
    value: [number, number]
    onChange: (value: [number, number]) => void
}> = ({ field, value, onChange }) => {
    const slider = useTc<HTMLElement>({
        value,
        onChange: (next: unknown) => {
            if (Array.isArray(next) && next.length === 2) onChange([Number(next[0]), Number(next[1])])
        },
    })
    return (
        <tc-range-slider
            ref={slider}
            min={String(field.rangeMin ?? 0)}
            max={String(field.rangeMax ?? 100)}
            step={String(field.rangeStep ?? 1)}
            show-tooltip
        ></tc-range-slider>
    )
}

const FiltersModal: React.FC = () => {
    const closeModal = useModalClose()
    const input = useModalInput<FiltersInput>(MODAL.FILTERS)
    const { t } = useStrings()
    const f = t.filters

    const [state, setState] = useState<FiltersResult>({})
    useEffect(() => {
        if (!input) return
        const initial: FiltersResult = {}
        for (const field of input.fields) {
            initial[field.key] =
                field.kind === 'chips-multi'
                    ? field.values ?? []
                    : field.kind === 'range'
                      ? field.range ?? [field.rangeMin ?? 0, field.rangeMax ?? 100]
                      : field.value ?? (field.kind === 'select' ? field.emptyKey ?? 'all' : '')
        }
        setState(initial)
    }, [input])

    const set = (key: string, value: string | string[] | [number, number]) =>
        setState((current) => ({ ...current, [key]: value }))

    const clearAll = () => {
        if (!input) return
        const cleared: FiltersResult = {}
        for (const field of input.fields) cleared[field.key] = emptyValueOf(field)
        closeModal(cleared)
    }

    return (
        <>
            <div className="modal-filters">
                {(input?.fields ?? []).map((field) => (
                    <div key={field.key} className="modal-filters__field">
                        <tc-label>{field.label}</tc-label>
                        {field.kind === 'select' && (
                            <FieldSelect
                                field={field}
                                value={String(state[field.key] ?? field.emptyKey ?? 'all')}
                                onChange={(value) => set(field.key, value)}
                            />
                        )}
                        {field.kind === 'combo' && (
                            <FieldCombo
                                field={field}
                                value={String(state[field.key] ?? '')}
                                onChange={(value) => set(field.key, value)}
                            />
                        )}
                        {field.kind === 'range' && (
                            <FieldRange
                                field={field}
                                value={(state[field.key] as [number, number]) ?? [field.rangeMin ?? 0, field.rangeMax ?? 100]}
                                onChange={(value) => set(field.key, value)}
                            />
                        )}
                        {field.kind === 'chips' && (
                            <div className="modal-filters__chips">
                                {(field.options ?? []).map((option) => {
                                    const active = state[field.key] === option.key
                                    return (
                                        <tc-button
                                            key={option.key}
                                            variant={active ? 'primary' : 'secondary'}
                                            outline={!active || undefined}
                                            size="sm"
                                            onClick={() => set(field.key, active ? '' : option.key)}
                                        >
                                            {option.label}
                                        </tc-button>
                                    )
                                })}
                            </div>
                        )}
                        {field.kind === 'chips-multi' && (
                            <div className="modal-filters__chips">
                                {(field.options ?? []).map((option) => {
                                    const values = (state[field.key] as string[]) ?? []
                                    const active = values.includes(option.key)
                                    return (
                                        <tc-button
                                            key={option.key}
                                            variant={active ? 'primary' : 'secondary'}
                                            outline={!active || undefined}
                                            size="sm"
                                            onClick={() =>
                                                set(
                                                    field.key,
                                                    active
                                                        ? values.filter((entry) => entry !== option.key)
                                                        : [...values, option.key]
                                                )
                                            }
                                        >
                                            {option.label}
                                        </tc-button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <tc-button slot="footer" variant="primary" onClick={() => closeModal(state)}>
                {f.apply}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={clearAll}>
                {f.clear}
            </tc-button>
            <tc-button slot="footer" variant="secondary" outline onClick={() => closeModal(null)}>
                {t.modal.cancel}
            </tc-button>
        </>
    )
}

export default FiltersModal
