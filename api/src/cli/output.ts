export const out = (text: string): void => { process.stdout.write(`${text}\n`) }

export const table = (rows: Array<Record<string, unknown>>): void => {
    if (rows.length === 0) {
        out('(none)')
        return
    }
    const headers = Object.keys(rows[0])
    const widths = headers.map((header) =>
        Math.max(header.length, ...rows.map((row) => String(row[header] ?? '').length)))
    const line = (cells: string[]): string =>
        cells.map((cell, index) => cell.padEnd(widths[index])).join('  ')
    out(line(headers))
    out(line(widths.map((width) => '-'.repeat(width))))
    for (const row of rows) out(line(headers.map((header) => String(row[header] ?? ''))))
}

export const iso = (input: string | null): string | null => {
    if (input === null) return null
    return new Date(input).toISOString().replace('T', ' ').slice(0, 19)
}
