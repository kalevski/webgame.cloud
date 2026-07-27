export const isBlank = (value: string): boolean => value.trim().length === 0

export const withinMaxLen = (value: string, max: number): boolean => value.length <= max

export const isIntInRange = (value: number, min: number, max: number): boolean =>
    Number.isInteger(value) && value >= min && value <= max

export const isOneOf = <T extends string>(value: string, allowed: readonly T[]): value is T =>
    (allowed as readonly string[]).includes(value)

export const isRequiredText = (value: string, max: number): boolean =>
    !isBlank(value) && withinMaxLen(value, max)

export const isOptionalText = (value: string, max: number): boolean =>
    isBlank(value) || withinMaxLen(value, max)
