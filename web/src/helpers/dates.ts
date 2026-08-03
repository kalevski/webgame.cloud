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

const RELATIVE_FORMAT = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'narrow' })

const RELATIVE_UNITS: ReadonlyArray<readonly [Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['week', 604_800_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
]

export const formatRelative = (value: string | number | Date | null | undefined, fallback = '—'): string => {
    const date = parse(value)
    if (!date) return fallback
    const diff = date.getTime() - Date.now()
    const magnitude = Math.abs(diff)
    for (const [unit, ms] of RELATIVE_UNITS) {
        if (magnitude >= ms) return RELATIVE_FORMAT.format(Math.round(diff / ms), unit)
    }
    return RELATIVE_FORMAT.format(0, 'second')
}
