export const clampOffset = (offset: number, total: number, pageSize: number): number => {
    if (total <= 0) return 0
    const lastPageOffset = Math.floor((total - 1) / pageSize) * pageSize
    return Math.min(offset, lastPageOffset)
}
