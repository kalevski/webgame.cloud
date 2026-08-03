import React from 'react'

const BLOCKED_VALUE = /javascript:|expression\(|url\(\s*['"]?(?!#)/i

const toCamel = (property: string): string =>
    property.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())

export const parseLayerCss = (css: string | undefined): React.CSSProperties => {
    if (!css || !css.trim()) return {}

    const style: Record<string, string> = {}
    for (const declaration of css.split(';')) {
        const separator = declaration.indexOf(':')
        if (separator < 0) continue

        const property = declaration.slice(0, separator).trim()
        const value = declaration.slice(separator + 1).trim()
        if (!property || !value) continue
        if (BLOCKED_VALUE.test(value)) continue

        style[property.startsWith('--') ? property : toCamel(property)] = value
    }
    return style as React.CSSProperties
}
