import { detailValue } from '@toolcase/web-components/react'

export const selectedKeys = (event: Event): string[] => {
    const value = detailValue<string[] | string>(event as CustomEvent)
    if (Array.isArray(value)) return value.map(String)
    if (typeof value === 'string') return value.split(',').filter(Boolean)
    return []
}

export const toKeyList = (keys: string[]): string => (Array.isArray(keys) ? keys.join(',') : '')
