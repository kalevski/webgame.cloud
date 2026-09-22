import React, { useEffect, useMemo, useRef } from 'react'
import { useTc } from '@toolcase/web-components/react'
import useStableValue from 'hooks/useStableValue'

export type AdvancedTableColumn = {
    key: string
    label: string
    align?: 'left' | 'center' | 'right'
    width?: string

    hideBelow?: 'sm' | 'md' | 'lg'

    minWidth?: string
}

export type AdvancedTableFilter = {
    key: string
    label: string
    type: 'text' | 'select'
    options?: { value: string; label: string }[]
    placeholder?: string
}

export type AdvancedTableSort = {
    column: string
    direction: 'asc' | 'desc'
}

type AdvancedTableProps = {
    columns: AdvancedTableColumn[]

    rows: string
    total: number
    offset: number
    limit?: number
    loading?: boolean
    filters?: AdvancedTableFilter[]
    filterValues?: Record<string, string>
    sortableColumns?: string[]
    sort?: AdvancedTableSort | null

    stickyFirstColumn?: boolean

    stickyLastColumn?: boolean
    onFilterChange?: (key: string, value: string) => void
    onSortChange?: (sort: AdvancedTableSort | null) => void
    onPageChange?: (offset: number) => void

    onRowAction?: (action: string, id: string, value?: string) => void
}

type FilterableTable = HTMLElement & { filterValues?: Record<string, string> }

const NO_FILTERS: AdvancedTableFilter[] = []
const NO_SORTABLE: string[] = []
const NO_FILTER_VALUES: Record<string, string> = {}

const useStableByValue = <T,>(value: T): T => {
    const key = JSON.stringify(value)
    return useMemo(() => JSON.parse(key) as T, [key])
}

const AdvancedTable: React.FC<AdvancedTableProps> = ({
    columns,
    rows,
    total,
    offset,
    limit = 10,
    loading = false,
    filters = NO_FILTERS,
    filterValues = NO_FILTER_VALUES,
    sortableColumns = NO_SORTABLE,
    sort = null,
    stickyFirstColumn = false,
    stickyLastColumn = false,
    onFilterChange,
    onSortChange,
    onPageChange,
    onRowAction,
}) => {
    const stableColumns = useStableByValue(columns)
    const stableFilters = useStableByValue(filters)
    const stableSortable = useStableByValue(sortableColumns)

    const liveFilters = useRef<Record<string, string>>({ ...filterValues })
    const filtersApplied = useRef(false)

    const table = useTc<FilterableTable>(
        {
            columns: useStableValue(columns),
            rows,
            total,
            offset,
            limit,
            loading,
            filters: useStableValue(filters),
            filterValues: useStableValue(filterValues),
            sortableColumns: useStableValue(sortableColumns),
            sort: useStableValue(sort),
            onFilterChange: (key: string, value: string) => onFilterChange?.(key, value),
            onSortChange: (next: AdvancedTableSort | null) => onSortChange?.(next),
            onPageChange: (nextOffset: number) => onPageChange?.(nextOffset),
        },
        {
            click: (event: Event) => {
                const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')
                if (!trigger || trigger instanceof HTMLSelectElement) return
                onRowAction?.(trigger.dataset.action ?? '', trigger.dataset.id ?? '')
            },
            change: (event: Event) => {
                const trigger = event.target as HTMLElement
                if (!(trigger instanceof HTMLSelectElement) || !trigger.dataset.action) return
                onRowAction?.(trigger.dataset.action, trigger.dataset.id ?? '', trigger.value)
            },
        }
    )

    useEffect(() => {
        const element = table.current
        if (!element) return
        if (filtersApplied.current && JSON.stringify(filterValues) === JSON.stringify(liveFilters.current)) return

        filtersApplied.current = true
        liveFilters.current = { ...filterValues }
        element.filterValues = liveFilters.current
    }, [filterValues, table])

    return (
        <tc-advanced-table
            ref={table}
            sticky-first-column={stickyFirstColumn || undefined}
            sticky-last-column={stickyLastColumn || undefined}
        ></tc-advanced-table>
    )
}

export default AdvancedTable
