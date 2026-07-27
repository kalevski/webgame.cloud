export type Cursor = {
    createdAt: Date
    id: string
}

export type CursorQuery = {
    createdAt: Date | null
    id: string | null
}

export const NO_CURSOR: CursorQuery = { createdAt: null, id: null }

export const encodeCursor = (createdAt: Date, id: string): string =>
    Buffer.from(`${createdAt.toISOString()}|${id}`, 'utf8').toString('base64url')

export const decodeCursor = (cursor: string | null | undefined): CursorQuery => {
    if (!cursor) return NO_CURSOR

    try {
        const raw = Buffer.from(cursor, 'base64url').toString('utf8')
        const separator = raw.indexOf('|')
        if (separator < 0) return NO_CURSOR

        const createdAt = new Date(raw.slice(0, separator))
        const id = raw.slice(separator + 1)
        if (Number.isNaN(createdAt.getTime()) || !id) return NO_CURSOR

        return { createdAt, id }
    } catch {
        return NO_CURSOR
    }
}

export const takePage = <T>(
    rows: T[],
    limit: number,
    pick: (row: T) => Cursor
): { rows: T[]; nextCursor: string | null } => {
    if (rows.length <= limit) return { rows, nextCursor: null }

    const page = rows.slice(0, limit)
    const last = page[page.length - 1]
    if (!last) return { rows: page, nextCursor: null }

    const { createdAt, id } = pick(last)
    return { rows: page, nextCursor: encodeCursor(createdAt, id) }
}
