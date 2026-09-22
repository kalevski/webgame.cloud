export type Random = {
    int(min: number, max: number): number
    pick<T>(values: readonly T[]): T
    chance(probability: number): boolean
    shuffle<T>(values: readonly T[]): T[]
    daysAgo(min: number, max: number): Date
}

const hash = (seed: string): number => {
    let value = 2166136261
    for (let index = 0; index < seed.length; index += 1) {
        value ^= seed.charCodeAt(index)
        value = Math.imul(value, 16777619)
    }
    return value >>> 0
}

export const random = (seed: string): Random => {
    let state = hash(seed) || 1

    const next = (): number => {
        state ^= state << 13
        state ^= state >>> 17
        state ^= state << 5
        state >>>= 0
        return state / 0x100000000
    }

    const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1))

    return {
        int,
        pick: <T,>(values: readonly T[]): T => values[int(0, values.length - 1)],
        chance: (probability: number): boolean => next() < probability,
        shuffle: <T,>(values: readonly T[]): T[] => {
            const copy = [...values]
            for (let index = copy.length - 1; index > 0; index -= 1) {
                const swap = int(0, index)
                const held = copy[index]
                copy[index] = copy[swap]
                copy[swap] = held
            }
            return copy
        },
        daysAgo: (min: number, max: number): Date =>
            new Date(Date.now() - int(min, max) * 24 * 60 * 60 * 1000 - int(0, 86_399) * 1000),
    }
}
