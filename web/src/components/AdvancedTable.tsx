import React from 'react'
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

const AdvancedTable: React.FC<AdvancedTableProps> = ({
    columns,
    rows,
    total,
    offset,
    limit = 10,
    loading = false,
    filters = [],
    filterValues = {},
    sortableColumns = [],
    sort = null,
    stickyFirstColumn = false,
    stickyLastColumn = false,
    onFilterChange,
    onSortChange,
    onPageChange,
    onRowAction,
}) => {
    const table = useTc<HTMLElement>(
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

    return (
        <tc-advanced-table
            ref={table}
            sticky-first-column={stickyFirstColumn || undefined}
            sticky-last-column={stickyLastColumn || undefined}
        ></tc-advanced-table>
    )
}

export default AdvancedTable
