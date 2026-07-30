import React from 'react'
import useStrings from 'hooks/useStrings'

export type FilterChip = {
    id: string
    label: string
    count?: number
}

export type FilterChipRow = {
    key: string
    legend: string
    chips: FilterChip[]
    value: string | null
    onChange: (id: string | null) => void

    toggle?: boolean
}

export type FilterControlRow = {
    key: string
    legend: string
    control: React.ReactNode
}

export type FilterRow = FilterChipRow | FilterControlRow

type FilterBarProps = {
    rows: FilterRow[]

    total: number
    matches: number
    unit: string

    active?: boolean
    onClear?: () => void
}

const isChipRow = (row: FilterRow): row is FilterChipRow => 'chips' in row

const FilterBar: React.FC<FilterBarProps> = ({ rows, total, matches, unit, active = false, onClear }) => {
    const { t } = useStrings()
    const f = t.filters
    const narrowed = active && matches !== total

    return (
        <section className="filter-bar" data-active={active ? 'true' : 'false'}>
            <div className="filter-bar__rows">
                {rows.map((row) => (
                    <div key={row.key} className="filter-bar__row">
                        <span className="filter-bar__legend" id={`filter-legend-${row.key}`}>
                            {row.legend}
                        </span>

                        {isChipRow(row) ? (
                            <div
                                className="filter-bar__chips"
                                role="group"
                                aria-labelledby={`filter-legend-${row.key}`}
                            >
                                {row.chips.map((chip) => {
                                    const selected = row.value === chip.id
                                    return (
                                        <button
                                            key={chip.id}
                                            type="button"
                                            className="filter-bar__chip"
                                            data-active={selected ? 'true' : 'false'}
                                            aria-pressed={selected}
                                            onClick={() =>
                                                row.onChange(selected && row.toggle ? null : chip.id)
                                            }
                                        >
                                            <tc-badge variant="secondary">
                                                {chip.label}
                                                {chip.count !== undefined && (
                                                    <span className="filter-bar__chip-count">{chip.count}</span>
                                                )}
                                            </tc-badge>
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="filter-bar__control">{row.control}</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="filter-bar__readout">
                <p className="filter-bar__count" aria-live="polite">
                    {narrowed ? (
                        <>
                            <strong className="filter-bar__matches">{matches}</strong>
                            <span className="filter-bar__of">{f.ofTotal(total)}</span>
                        </>
                    ) : (
                        <strong className="filter-bar__matches filter-bar__matches--all">{total}</strong>
                    )}
                    <span className="filter-bar__unit">{unit}</span>
                </p>

                {active && onClear && (
                    <button type="button" className="filter-bar__clear" onClick={onClear}>
                        {f.clear}
                    </button>
                )}
            </div>
        </section>
    )
}

export default FilterBar
