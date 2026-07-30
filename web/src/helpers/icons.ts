export const toIconName = (value: string): string => {
    const raw = (value ?? '').trim()
    if (!raw) return ''
    if (!raw.includes('-') && raw[0] === raw[0].toUpperCase()) return raw
    return raw
        .split('-')
        .filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('')
}
