export const queryString = (filters: object): string => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
    }
    const encoded = params.toString()
    return encoded ? `?${encoded}` : ''
}
