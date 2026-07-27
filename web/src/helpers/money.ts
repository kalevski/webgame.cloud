const formatters = new Map<string, Intl.NumberFormat>()

const formatterFor = (currency: string): Intl.NumberFormat => {
    const cached = formatters.get(currency)
    if (cached) return cached
    const created = new Intl.NumberFormat(undefined, { style: 'currency', currency })
    formatters.set(currency, created)
    return created
}

export const formatMoney = (amountCents: number, currency: string): string =>
    formatterFor(currency).format(amountCents / 100)
