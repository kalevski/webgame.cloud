const DATE_FORMAT: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }

const TIME_FORMAT: Intl.DateTimeFormatOptions = { ...DATE_FORMAT, hour: '2-digit', minute: '2-digit' }

const parse = (value: string | number | Date | null | undefined): Date | null => {
    if (value === null || value === undefined || value === '') return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

export const formatDate = (value: string | number | Date | null | undefined, fallback = '—'): string => {
    const date = parse(value)
    return date ? date.toLocaleDateString(undefined, DATE_FORMAT) : fallback
}

export const formatDateTime = (value: string | number | Date | null | undefined, fallback = '—'): string => {
    const date = parse(value)
    return date ? date.toLocaleString(undefined, TIME_FORMAT) : fallback
}
